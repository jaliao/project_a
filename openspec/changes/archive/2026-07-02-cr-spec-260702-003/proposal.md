## Why

以名冊/證書 seed 建立的學習歷程（見 `cr-spec-260702-001`）無法完全正確：部分學員歷程遺失、對應到錯誤老師、或應結業卻標為未結業（含 39 位「有證書無班級」者、班級名單缺漏等）。需提供學員自助回饋管道，並讓管理者於後台審核補資料，收斂資料誤差。

## What Changes

- **學員端**：於學習紀錄頁新增回饋入口「是否遺失您的學習歷程？請在這裡回饋」，開啟回饋表單。
  - 學員選**回饋類別**（遺失學習歷程 / 老師名稱錯誤 / 應結業卻標未結業）。
  - 填寫**老師名稱（自由文字）**、選擇**學習課程（課程目錄下拉：啟動靈人/豐盛/得勝）**、可加備註。
  - 可查看自己送出的回饋與處理狀態。
- **管理者端**：新增後台「學習歷程回饋」審核頁，逐筆處理：
  - **遺失學習歷程** → 同意建檔：由管理者從現有教師中**選擇正確老師** → 新增一個課程（該老師帶、對應課程目錄）→ 將學員加入並**直接畢業 2025/09/01**。
  - **老師名稱錯誤** → 同意：從**錯誤班級移除**該學員報名 → 選擇正確老師 → 新增課程 → 直接畢業 2025/09/01。
  - **應結業卻未結業** → 同意：將學員該筆現有報名改為**已結業（2025/09/01）**並清除未結業原因（必要時一併補課程結業）。
  - 可**婉拒**並填理由；處理結果回寫回饋狀態。
- 老師名稱為自由文字，系統**不自動對應**；一律由管理者於後台選定現有教師。
- 補建所新增的課程，標題標記**「（補建）」**以利辨識（多為單人班）。
- `wrong_teacher`／`not_graduated` 的既有紀錄一律由管理者於後台定位；本次**不通知學員**。
- 依 CLAUDE.md 第 12 條，新文案入 i18n（`messages/zh-TW.json`＋`en.json`），不寫死中文。

## Capabilities

### New Capabilities
- `learning-record-feedback`: 學員端學習歷程回饋——入口、送出（類別／老師名稱／課程／備註）、查看自己回饋狀態。
- `learning-record-backfill-admin`: 管理者端審核與補資料——選定老師、新增課程並畢業、更正老師（移除錯誤班級後重建）、更正結業狀態、婉拒。

### Modified Capabilities
<!-- 學習紀錄頁僅新增回饋入口（附加式），不改既有需求；後台為新頁。暫無既有能力之需求變更。 -->

## Impact

- **資料模型**：新增 `LearningRecordFeedback`（`userId`、`category` enum、`teacherName` 文字、`courseCatalogId`、`note?`、`status` enum pending/approved/rejected、`resolvedById?`/`resolvedAt?`/`adminNote?`、可選 `resultInviteId?` 供稽核）。migration `add_learning_record_feedback`。
- **既有模型寫入**：核准時建立 `CourseInvite`（`completedAt=2025/09/01`）與 `InviteEnrollment`（`graduatedAt=2025/09/01`）；更正老師時刪除/調整既有 `InviteEnrollment`；更正結業時更新 `graduatedAt`／`nonGraduateReason`。
- **路由/頁面**：學員學習紀錄頁新增回饋入口與表單（client dialog）；後台新增 `(admin)/admin/learning-feedback` 頁與處理動作（放入 `(admin)` group，免自寫守衛）。
- **Server actions**：`app/actions/learning-feedback.ts`（學員送出／查看）與後台處理動作（同意建檔／更正老師／更正結業／婉拒）；沿用 `ActionResponse`、`revalidatePath`。
- **i18n**：新增 `learningFeedback`（暫定）命名空間文案；驗證訊息走 `validation.*`。
- **文件**：屬功能異動 → 同步三份操作手冊（學員：如何回饋；管理者：如何審核補資料）＋版本號（apply 時）。
