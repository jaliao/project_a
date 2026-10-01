## Context

使用者截圖顯示英文模式下畫面仍殘留大量中文。逐項定位後發現殘留分三種完全不同的性質，必須分開處理：

1. 有 i18n key 但英文翻譯值本身還是中文（純內容缺漏）。
2. 有 i18n key、英文翻譯早就存在，但顯示端程式碼繞過 i18n 直接引用純文字 map（`ROLE_LABELS` 等）——架構已具備，只是沒接上。
3. 完全沒有任何 i18n 承載層——課程名稱是 `CourseCatalog.label` 的 DB 內容字串，程式碼裡沒有「DB 字串 → 顯示語言」的轉換點；個人首頁整頁沒有 import `next-intl`。

三者需要的修法完全不同，因此拆成三個獨立的架構決策。

## Goals / Non-Goals

**Goals:**
- 讓既有 i18n 架構（`messages/*.json`）真正發揮作用：翻譯值补齊、繞過 i18n 的顯示端改接回去
- 為「DB 內容字串需要雙語顯示」這類目前架構沒有解法的情境，建立最小必要的映射層，不動 Prisma schema
- 個人首頁（本次中文殘留最集中的單一頁面）全面補上 next-intl

**Non-Goals:**
- 不改變 `CourseCatalog` 的資料模型（不新增 `labelEn` 欄位、不做 migration）——使用者已確認採用翻譯映射表而非 schema 調整
- 不處理 `config/learning-outline.ts` 課綱內容翻譯——性質是內容撰寫，獨立另開 CR
- 不修改 `seo-metadata` 規格既有要求文字本身的中文關鍵字（那是描述 zh-TW 預設語言行為的範例，非跨語言常數）
- 不新增「後台管理頁」的 i18n 覆蓋——沿用專案既有慣例（`i18n-course` 規格「後台與其專屬字串本階段維持繁體」），本次僅處理前台使用者會以英文檢視的頁面與共用元件

## Decisions

### 決策一：enum/label map 全面改接 i18n，非 React 情境維持原 map 不變

**做法**：`ROLE_LABELS`、教材訂單狀態 `LABELS`、`ADMIN_LOG_ACTIONS` 的 `label`，顯示端（React 元件）一律改為 `t(`namespace.${key}`)`；`course-start-gate.ts` 的 reasons 文案（同時供 UI tooltip 與 server action 拒絕訊息使用）需要特別處理——**伺服器端訊息維持原樣（繁體字串，依專案既有「動作層 message 文案維持原樣」慣例）**，僅 UI 顯示端另外透過 i18n key 呈現，兩者分離，不共用同一段回傳字串。

**理由**：
- 多組 map 的英文翻譯其實早就存在於 `messages/en.json`（如 `role.teacher_1`），純粹是顯示端沒接上——這是對既有 `i18n-enum-labels` 規格的補implement，不是新規則。
- `material-order-status.ts` 與 `admin-log-action.ts` 目前無對應 i18n key，需要新增；因為這兩組 map 的 key（如 `pending_payment`、`enrollment_add`）本身即穩定識別碼，適合直接當 i18n key 的 leaf 名稱。
- Excel 匯出等非 React 情境依既有規格繼續使用原 map，不受影響。
- `course-start-gate.ts` 的 reasons 字串目前「UI 顯示與 server 拒絕訊息共用同一段文字」——若直接把這段改成 i18n key，server action 回傳給前端的會變成 key 字串而非人類可讀文字，需要前端再翻譯一次，增加不必要的耦合；且專案既有慣例是「動作層 message 文案維持原樣」（見 `i18n-course` 規格）。因此本次拆成兩段：UI tooltip 顯示改用 i18n key 計算、server action 內部判斷邏輯與既有繁體錯誤訊息不變。

### 決策二：課程名稱用「翻譯映射表」，不動 DB schema

**做法**：新增 `catalog` i18n 命名空間（`messages/zh-TW.json` / `en.json`），以 `CourseCatalog.label` 的既有中文字串本身為 key（比照 `courses.fallback` 已示範的手法），value 為對應語言的顯示名稱：

```json
// zh-TW.json
"catalog": {
  "啟動事工": "啟動事工",
  "啟動靈人": "啟動靈人",
  "啟動豐盛": "啟動豐盛",
  "啟動得勝": "啟動得勝"
}
// en.json
"catalog": {
  "啟動事工": "Activate Ministry",
  "啟動靈人": "Activate Spiritman",
  "啟動豐盛": "Activate Abundance",
  "啟動得勝": "Activate Victory"
}
```

顯示端提供共用 helper（如 `translateCatalogLabel(t, label)`），查表命中則回傳譯名，查不到（例如未來新增課程目錄但尚未補 key）則 fallback 回傳原始 `label`，不中斷畫面。

**理由**：
- 使用者已確認此做法（翻譯表映射，不動 schema），上線快、不需 `make schema-update` 補 migration 與既有 3 筆資料的英文值。
- `i18n-messages` 規格本就已將 `catalog` 列為最小必要命名空間之一，只是先前從未真正建立——本次是把既有規格補上實作，而非新增規格要求。
- 與 `courses.fallback` 既有手法一致（用中文字串當 key），維持專案內部一致性，不引入第二套映射機制。

**已知命名不一致，本次順帶統一**：`messages/en.json` 既有的 `role.teacher_1`（"Activate Spirit Instructor"）與 `seo.defaultTitle`／`seo.description`（"Activate Spirit"）用的是「Activate Spirit」，與使用者本次指定的「Activate Spiritman」不同。本次一併將這兩處改為 "Activate Spiritman"，以單一譯名統一全站（見 tasks.md）。

### 決策三：`metadata.title` 批次改走 i18n，建立統一模式供後續頁面沿用

**做法**：盤點受影響頁面後，各頁 `export const metadata` 改為 `export async function generateMetadata()`，以 `getTranslations` 取用對應 feature 命名空間已存在或新增的 `metaTitle` key（多個 feature 命名空間已有 `metaTitle` 慣例，如 `learning.metaTitle`），不新建獨立的「全站 metaTitle 命名空間」。

**理由**：
- 與現有 `learning.metaTitle`／`courses.metaTitle` 等慣例一致，避免新建平行機制。
- `seo-metadata` 規格的 `title.template`（`%s — 啟動事工`）機制不變——各頁仍只需提供「短 title」，套件自動加站名後綴；本次只是把「短 title」本身從寫死字串改為 i18n key 取值。

## Risks / Trade-offs

- [`course-start-gate.ts` reasons 文案拆成 UI 與 server 兩份] → 可接受：維持與既有「動作層 message 維持原樣」慣例一致，避免 server 回傳未翻譯 key 給前端的耦合問題；多一份文案需要同步維護，但範圍小（僅此一處）
- [新增 `catalog` 命名空間後，四個課程目錄字串需要被所有顯示端一致查表] → 已知風險：若未來新增 `CourseCatalog` 卻忘記補 `catalog.*` key，對應名稱會 fallback 顯示中文原文——可接受（不破版，僅該筆英文模式下顯示中文名稱，與現況相同不會更差）
- [統一「Activate Spirit」→「Activate Spiritman」譯名] → 影響範圍含 `role` 與 `seo` 命名空間既有英文值，需人工確認這是使用者期望的統一方向（已於 proposal 階段與使用者確認採用「Activate Spiritman」）

## Migration Plan

1. 翻譯檔補齊與新增（`messages/zh-TW.json`／`en.json`）：品牌名稱、`catalog` 命名空間、教材訂單狀態／操作紀錄 action 缺的 key
2. 執行 `npm run gen:zh-cn` 重新產生 `messages/zh-CN.json`
3. 顯示端程式碼改接：`ROLE_LABELS`／材料訂單狀態／操作紀錄 action 呼叫端、課程名稱顯示端（新增 `translateCatalogLabel` helper）
4. 個人首頁（`app/[locale]/(user)/user/[spiritId]/page.tsx`）與相關子元件（`course-progress-cards.tsx` 等）補上 `getTranslations`/`useTranslations`
5. 課程詳情頁剩餘硬編碼（新增/移除學員按鈕、課程操作 LOG、`invite-student-cells.tsx`）補 i18n
6. 批次處理頁面 `metadata.title`
7. `npm run build` 確認無編譯錯誤；手動切換 zh-TW / en 比對截圖所列頁面確認無中文殘留
