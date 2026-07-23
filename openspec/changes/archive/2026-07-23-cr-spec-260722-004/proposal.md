## Why

「學習歷程回饋」（`learning-record-feedback`）是舊有的自助回報機制，與後續已上線的「聯繫管理者」（`contact-admin`，`SupportInquiry`）功能性質重疊、入口分散。收掉舊回饋歷程，統一導向聯繫管理者，可讓學員只需認一套提問/回報入口，也簡化個人頁與後台維護面。

## What Changes

- 個人頁「學習紀錄」區塊移除「課程結業狀態卡片＋一鍵回報」與「我送出的回饋」歷程清單、回饋表單 Dialog（**BREAKING**：學員不再能用此表單回報遺失學習歷程／老師錯誤／未結業）。
- 個人頁「學習紀錄」區塊改為嵌入該學員最近 3 筆「聯繫管理者」提問（`SupportInquiry`，依提問時間倒序），並提供「看更多」按鈕導向既有的 `/user/{spiritId}/inquiries` 頁面。
- 移除 `learning-record-feedback` 相關前後台程式碼：
  - `components/learning/feedback-entry.tsx`（`LearningRecordsPanel`）
  - `app/actions/learning-feedback.ts`
  - `lib/data/learning-feedback.ts`
  - `lib/schemas/learning-feedback.ts`
  - `app/[locale]/(admin)/admin/learning-feedback/page.tsx`
  - `components/admin/learning-feedback-actions.tsx`
  - `app/[locale]/(admin)/admin/page.tsx` 中對後台「學習歷程回饋」快捷卡片／待處理計數的引用
  - `messages/*.json` 中 `learningFeedback` 命名空間
- **資料庫**：`LearningFeedback` Prisma model **不刪除**（正式環境已有歷史資料，保留供未來查詢／稽核），僅停止產生新資料與移除所有讀寫程式碼；不建立刪表 migration。

## Capabilities

### New Capabilities
（無）

### Modified Capabilities
- `learning-record-feedback`：全部既有需求（回饋入口、送出回饋、本人結業狀態與一鍵回報、查看自己的回饋狀態）retired，delta spec 以 `REMOVED Requirements` 表示；程式碼與 UI 全數移除，僅資料表保留不刪。
- `contact-admin`：新增需求——學員個人頁「學習紀錄」區塊 SHALL 顯示本人最近 3 筆提問（依提問時間倒序）與「看更多」按鈕，導向 `/user/{spiritId}/inquiries`。

## Impact

- **Affected code**：`app/[locale]/(user)/user/[spiritId]/page.tsx`（改用 `getMyInquiries` 取代 `getMyLearningFeedbacks`／`LearningRecordsPanel`）、`lib/data/support-inquiry.ts`（沿用既有 `getMyInquiries`，個人頁僅取前 3 筆）。
- **Removed code**：見上述「移除」清單（components / actions / data / schemas / admin page / admin dashboard 引用 / i18n messages）。
- **Database**：`LearningFeedback` 表保留但不再寫入；`prisma/schema/*.prisma` 暫不變動（不建立 migration）。
- **Docs**：`doc/學員手冊.md`、`doc/管理者操作手冊.md` 需同步移除「學習歷程回饋」相關段落說明（依 CLAUDE.md 第 9 點）。
- **Dependencies**：無新增套件；沿用既有 `contact-admin` 資料層與頁面。
