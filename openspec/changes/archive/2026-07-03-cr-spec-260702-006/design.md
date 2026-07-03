# 個人首頁整合學習進度與結業證明 — 技術設計（cr-spec-260702-006）

## Context

個人首頁 `/user/[spiritId]`（server component）已查詢 `getMyCompletionCertificates(user.id)`（每課程目錄取最新 `graduatedAt`，含班名、老師名）供「結業證明」區塊與他人視角「學習紀錄預覽」使用；`/learning` 頁另以 `getAllCourses()`＋`getGraduatedCatalogIds()` 渲染 `LevelProgress` 進度摘要。三處資訊重複。使用者已確認：卡片依課程目錄順序（啟動靈人→啟動豐盛→啟動得勝）、他人視角刪除學習紀錄預覽、基本資料區塊（含三卡）維持公開。

依賴盤點（皆已驗證單一使用處，可安全刪除）：
- `components/learning/level-progress.tsx` → 僅 `/learning` 使用
- `components/course-invite/completion-certificate-card.tsx` → 僅個人首頁使用
- `messages/*.json` 之 `learning.*` → 僅 `/learning` 使用
- `/learning` 的入站連結僅個人首頁他人視角「查看更多」（該區塊本次刪除）；dashboard 實作已無連結

## Goals / Non-Goals

**Goals:**
- 基本資料區塊內固定三卡（目錄順序），已結業顯示學業完成時間，公開可見
- 刪除 `/learning`、原結業證明區塊、他人視角學習紀錄預覽，及其孤兒元件與 i18n
- 本人「學習紀錄」面板（結業狀態＋回饋入口）原樣保留

**Non-Goals:**
- 不動 `/user/[spiritId]/courses`（授課紀錄頁）與授課、管理者單元
- 不動後台學習歷程回饋處理流程
- 無 schema／migration

## Decisions

### D1：三卡資料＝`getAllCourses()` ⨯ `getMyCompletionCertificates()` 合成，不新增查詢
- 個人首頁已取得 certificates；再取 `getAllCourses()`（目錄順序）左式合成：每個目錄一張卡，有對應 certificate → 已完成（帶 `graduatedAt`、班名、老師名），無 → 未完成。
- **理由**：兩個資料函式皆既有且語意正確（每目錄取最新結業）；避免為 UI 新增資料層函式。
- **替代**：沿用 `getGraduatedCatalogIds()`（僅布林）——無法提供結業時間，放棄。

### D2：新元件 `components/learning/course-progress-cards.tsx`（server component），刪除兩個舊元件
- 純展示、無互動 → 不需 `"use client"`。樣式沿用 LevelProgress 的完成/未完成視覺語言（完成：實線＋primary 底；未完成：虛線＋灰階）＋完成卡加結業日期（`YYYY/MM/DD`）與班名／老師名小字。
- `level-progress.tsx` 與 `completion-certificate-card.tsx` 一併刪除（無其他使用處）。
- **理由**：合併後語意是「課程進度卡」而非「證書卡」，重寫比改造兩個舊元件乾淨。

### D3：置於基本資料區塊內部（同一 border 卡片內），不另起區塊
- 在既有「基本資料」`<div className="rounded-lg border p-5">` 內、身分標籤之後，加「學習進度」小節（三卡 grid，`grid-cols-1 sm:grid-cols-3`，手機優先直排）。
- **理由**：使用者明確要求「放在基本資料區塊裡面」。

### D4：`/learning` 刪除方式＝整目錄移除，不做轉導
- 系統未上線、無外部書籤負擔；刪除後命中友善 404（cr-spec-260701-006 已建）。`learning-feedback.ts` 五處 `revalidatePath('/learning')` 改為 `revalidatePath('/user/[spiritId]', 'page')` 無法帶動態參數——實際改法：回饋動作已知操作者 spiritId 時 revalidate 個人頁；取不到時 revalidate layout 級路徑。以實作階段現況為準，原則是**確保個人頁學習紀錄面板資料更新**。
- `messages/zh-TW.json`／`en.json` 移除 `learning` 命名空間（zh-CN 由 OpenCC 重新產生）。

### D5：他人視角預覽刪除後的公開資訊面
- 他人可見：基本資料（姓名、啟動編號、身分標籤、**三卡進度＋結業時間**）與課程列表；本人另見學習紀錄面板。結業時間本為公開（原結業證明區塊即公開），資訊面未擴大——反而收斂（他人不再看到逐班結業清單，僅每目錄一筆）。

## Risks / Trade-offs

- [刪 `/learning` 後外部連結 404] → 未上線無存量連結；已有友善 404 頁
- [revalidatePath 動態路徑限制] → 於 server action 內查操作者 `spiritId` 組實際路徑，或退而 revalidate 整個 `(user)` 區段；apply 時擇一驗證
- [三卡佔基本資料區塊高度（手機）] → 手機單欄直排、卡片精簡（標籤＋狀態＋日期一行化）

## Open Questions

（無）
