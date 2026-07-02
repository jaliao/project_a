## Context

`cr-spec-260702-001` 以名冊/證書 seed 了學習歷程，但資料不完全正確（歷程遺失、老師錯配、應結業標未結業，含 39 位有證書無班級者）。既有模型：`CourseInvite`（班級，`completedAt`＝課程結業、`createdById`＝講師）、`InviteEnrollment`（報名，`graduatedAt`＝結業、`nonGraduateReason`）、`CourseCatalog`（啟動靈人=1/豐盛=2/得勝=3）、`User.roles`。學習紀錄頁已存在（`learning-records`）。後台採 `(admin)` route group、group layout 即守衛。文案走 next-intl。本變更新增學員自助回饋 + 管理者補資料流程，收斂資料誤差。

## Goals / Non-Goals

**Goals:**
- 學員可於學習紀錄頁自助回饋三類問題（遺失歷程／老師錯誤／應結業卻未結業）並追蹤狀態。
- 管理者於後台逐筆審核並補資料：選定現有老師、新增課程並畢業（2025/09/01）、更正老師（移除錯誤班級後重建）、更正結業狀態、婉拒。
- 沿用既有資料模型寫入結業，維持與 seed 一致（結業日 2025/09/01）。

**Non-Goals:**
- 不自動比對老師（老師名稱為學員自由文字，一律由管理者選現有教師）。
- 不在此建立新教師帳號（若老師不存在，屬既有名冊維護，另處理）。
- 不改動 seed 或既有結業判定邏輯（`cr-spec-260702-001`）。
- 不處理證書製作（`CertificateProduction`）。

## Decisions

**1. 新增 `LearningRecordFeedback` 模型承載回饋與稽核**
欄位：`userId`（送出者）、`category`（enum：`missing_record`／`wrong_teacher`／`not_graduated`）、`teacherName`（文字，學員填）、`courseCatalogId`（目錄下拉）、`note?`、`status`（enum：`pending`／`approved`／`rejected`）、`resolvedById?`／`resolvedAt?`／`adminNote?`、`resultInviteId?`（核准建檔所建課程，供稽核與冪等）。理由：回饋與處理結果同表可追蹤；`resultInviteId` 防重複建檔。替代（複用 Notification/自由字串）否決：無結構化審核狀態。

**2. 類別驅動的管理者動作**
- `missing_record` → 選老師 + 新增 `CourseInvite`（`courseCatalogId`、`createdById`＝老師、`startedAt=completedAt=2025/09/01`）+ `InviteEnrollment`（學員、`graduatedAt=2025/09/01`）。
- `wrong_teacher` → 管理者指定學員**錯誤的既有報名**予以移除（刪 `InviteEnrollment`；該班若因此無人可留空），再比照 `missing_record` 於正確老師下重建並畢業。
- `not_graduated` → 管理者指定學員**既有報名**，設 `graduatedAt=2025/09/01`、清 `nonGraduateReason`；若該班未結業則一併補 `completedAt=2025/09/01`。
理由：三情境共用「畢業 2025/09/01」語意，動作差在建課或改既有報名。替代（單一泛用動作）否決：語意不同、易誤操作。

**3. 老師以「後台搜尋現有教師」選定**
學員送出的 `teacherName` 僅供參考；管理者以教師選擇器（依姓名/teacherNo 搜尋、限具講師身分者）綁定正確 `User`。

**4. 每次核准建立獨立課程（可為單人班）**
依需求「新增一個課程」，每筆核准建一筆 `CourseInvite`（該老師帶、對應目錄），學員即該班已結業學員。接受可能產生單人班的資料膨脹（見風險）。替代（掛入該老師既有同目錄班級）否決：需額外配對邏輯且語意模糊，本階段從簡。

**5. 頁面與動作放置**
學員：學習紀錄頁新增入口卡/橫幅（client dialog 表單，`react-hook-form`＋zod、`FieldError` i18n）；`app/actions/learning-feedback.ts` 送出/查詢。管理者：`(admin)/admin/learning-feedback` 頁（免自寫守衛），處理動作為 admin server actions；沿用 `ActionResponse`＋`revalidatePath`。

**6. 冪等與狀態機**
`pending → approved | rejected`（單向）。已處理之回饋不可再次執行建檔/移除；以 `status` 與 `resultInviteId` 守衛避免重複建課。

**7. 補建課程標題標記來源**
管理者建檔/更正老師所新增的課程（多為單人班），標題 SHALL 標記來源「（補建）」（如「{老師} 的 {課程}（補建）」），便於與正常開課辨識。

## Risks / Trade-offs

- **單人班資料膨脹**（每筆核准一個 `CourseInvite`）→ 可接受；日後若需可合併同老師同目錄班級，另議。
- **老師名稱歧義/同名**（學員文字）→ 由管理者於選擇器人工判定（顯示 teacherNo/教會輔助）。
- **重複處理造成重複建課** → 以 `status`＝approved 與 `resultInviteId` 防護；動作前重新讀取狀態。
- **wrong_teacher 誤刪報名** → 管理者須明確選定要移除的既有報名；動作於單一 `$transaction` 內完成（移除＋重建＋畢業）可回滾。
- **權限**：學員僅能送出/查看自己的回饋；處理動作限 admin（`(admin)` group 守衛）。

## Migration Plan

1. Prisma schema 新增 `LearningRecordFeedback`＋兩個 enum；`make schema-update name=add_learning_record_feedback`（新增表，非破壞性）。
2. 實作學員表單/動作、後台頁/動作、i18n 文案、（選配）通知。
3. 手動驗證：三類回饋各跑一次（建檔畢業／更正老師／改結業），確認學習紀錄與課程狀態正確。
4. Rollback：功能為新增表＋新頁，回滾即移除頁面/動作並保留或丟棄空表（無既有資料相依）。

## Resolved Decisions

- **通知學員**：不做（本次不寫 Inbox 通知）。
- **既有紀錄定位**：`wrong_teacher`／`not_graduated` 一律由管理者於後台定位要移除/更正的既有報名，學員表單不指定。
- **補建課程標題**：新增課程標題標記「（補建）」以利辨識。
