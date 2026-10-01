## Why

使用者（Justin）提供 7 張畫面截圖，指出即使已切換到英文模式，介面仍大量殘留中文：品牌名稱「啟動事工」、首頁各欄位標籤（姓名、啟動編號、身分標籤、學習進度、課程）、課程名稱膠囊（啟動靈人／啟動豐盛／啟動得勝）、教材訂單狀態（待付款）、課程操作紀錄、新增／移除學員按鈕等。盤點後發現問題分三種性質，而非單純補幾個翻譯字串：

1. **純翻譯缺漏**：`messages/en.json` 的 `common.appName` 等 key 翻譯值本身仍是中文；站內同時存在三套不一致的英文品牌名（footer 用 "Chidao Ministry"、SEO 用 "KUA Ministry"、`learning.metaTitle` 卻已用 "Activate Ministry"）。
2. **架構性缺口**：多組純文字 enum/label map（`ROLE_LABELS`、教材訂單狀態、操作紀錄 action label）完全繞過既有 `i18n-enum-labels` 規格要求的 i18n 呈現方式，即使對應英文翻譯早已存在於 `messages/en.json` 也沒接上。
3. **缺少承載層**：課程名稱「啟動靈人／啟動豐盛／啟動得勝」是 `CourseCatalog.label` 的資料庫內容字串，不是程式常數也不是現成 i18n key，目前沒有任何「DB 內容 → 顯示語言」的映射層，導致課程卡片、徽章、學習進度三卡永遠顯示中文，與當前語言無關。

此外，個人首頁（`/user/{spiritId}`，即截圖中的「首頁」頁面，對應 `student-profile-page` 規格）整頁完全沒有接 next-intl，是本次中文殘留最集中的頁面。

## What Changes

- **品牌英文名稱統一為 "Activate Ministry"**：補齊 `messages/en.json` 的 `common.appName`，並將 `footer.description`／`footer.copyright`／`seo.defaultTitle`／`seo.description` 的英文品牌名稱全部統一為 "Activate Ministry"，消除三套不一致譯名。
- **enum/label map 全面改接 i18n**：`lib/auth-roles.ts`（`ROLE_LABELS`）、`lib/utils/material-order-status.ts`（`LABELS`）、`config/admin-log-action.ts`（action label／trigger）、`lib/utils/course-start-gate.ts`（開課門檻 reasons 文案）改為透過 i18n key 呈現；新增教材訂單狀態與操作紀錄 action 尚缺的 i18n key。既有「非 React／匯出情境保留原 map」的規則不變。
- **新增課程名稱翻譯映射層**：新建 `catalog` i18n 命名空間（以 `CourseCatalog.label` 字串本身為 key，比照既有 `courses.fallback` 的做法），不修改 Prisma schema。對照表：
  - 啟動事工 = Activate Ministry
  - 啟動靈人 = Activate Spiritman
  - 啟動豐盛 = Activate Abundance
  - 啟動得勝 = Activate Victory
  所有顯示 `CourseCatalog.label` 的地方（課程卡片徽章、個人首頁學習進度三卡、課程分類標籤元件等）改為查此映射表，查不到則 fallback 顯示原文。
- **個人首頁（`student-profile-page`）全頁補 i18n**：目前完全沒有 `useTranslations`/`getTranslations`，含標題、各區塊標籤、學習進度卡狀態文字等，本次全數改接 i18n key。
- **課程詳情頁剩餘硬編碼補齊**：已核准學員區塊的「新增學員」／「移除學員」按鈕、「課程操作 LOG」區塊（標題／空狀態／筆數說明）、新增/移除學員 Dialog（`invite-student-cells.tsx`）改接既有 `i18n-course` 命名空間。
- **`metadata.title` 批次 i18n 化**：全站約 20+ 個頁面的瀏覽器分頁標題目前寫死中文字串，與畫面語言無關；本次建立統一模式（透過 `getTranslations` 取用）並套用到受影響頁面。

### 排除範圍

- `config/learning-outline.ts` 24 課課綱內容（課名、經文章節）的英文翻譯——工作性質是內容撰寫而非字串替換，獨立另開 CR 評估。
- 收件地址／銀行帳號等業務資料（`AdminSetting` 內容）——真實的台灣地址與銀行帳戶資訊，非 UI 翻譯議題，不在本次範圍。
- `seo-metadata` 規格既有的 `title.default`／`keywords` 要求文字本身含中文關鍵字（如「啟動靈人・啟動豐盛・啟動得勝」）——該規格描述的是 zh-TW（預設語言）行為範例，非跨語言常數，本次不修改該規格內容，僅調整 `en.json` 既有 key 的翻譯值。

## Capabilities

### New Capabilities
- `i18n-course-catalog-names`：建立課程名稱（`CourseCatalog.label`）的顯示語言映射層

### Modified Capabilities
- `i18n-common-strings`：新增品牌字串英文譯名統一規則、新增 `metadata.title` 批次 i18n 化規則
- `i18n-enum-labels`：擴大 React 顯示走 i18n 的覆蓋範圍至教材訂單狀態與操作紀錄 action label
- `i18n-course`：擴大課程詳情頁在地化範圍至「已核准學員」新增／移除學員按鈕與「課程操作 LOG」區塊
- `student-profile-page`：新增「個人首頁在地化」需求

## Impact

- **翻譯檔**：`messages/zh-TW.json`、`messages/en.json`（新增/修正多個 key；`messages/zh-CN.json` 由 `npm run gen:zh-cn` 自動重新產生，不手改）
- **程式碼**：`lib/auth-roles.ts`、`lib/utils/material-order-status.ts`、`config/admin-log-action.ts`、`lib/utils/course-start-gate.ts`、`app/[locale]/(user)/user/[spiritId]/page.tsx`、`components/learning/course-progress-cards.tsx`、`components/admin/invite-student-cells.tsx`、`app/[locale]/(user)/course/[id]/approved-students-section.tsx`、`app/[locale]/(user)/course/[id]/course-operation-log.tsx`、`components/course-session/course-catalog-badge.tsx` 及其呼叫端、約 20+ 個頁面的 `metadata.title`
- 無 Prisma schema／migration 變更
