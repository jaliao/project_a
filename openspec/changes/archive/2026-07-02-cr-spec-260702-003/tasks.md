## 1. 資料模型

- [x] 1.1 `prisma/schema/learning-feedback.prisma` 新增 `LearningRecordFeedback` 模型與關聯（User/CourseCatalog/CourseInvite 回關聯）
- [x] 1.2 新增 enum `FeedbackCategory`(missing_record/wrong_teacher/not_graduated)、`FeedbackStatus`(pending/approved/rejected)
- [x] 1.3 `make schema-update name=add_learning_record_feedback`（建 migration＋套用到 DB）— 需你的終端（DB 走容器內網）。（`prisma generate` 已跑，client 型別已就緒）

## 2. 共用 schema 與資料層

- [x] 2.1 `lib/schemas/learning-feedback.ts`（category/teacherName/courseCatalogId/note，訊息走 `validation.*` key）
- [x] 2.2 `lib/data/learning-feedback.ts`：查自己回饋、後台清單（pending 優先）、教師搜尋、學員既有報名

## 3. 學員端（learning-record-feedback）

- [x] 3.1 學習紀錄頁新增入口「是否遺失您的學習歷程？請在這裡回饋」（i18n）
- [x] 3.2 回饋表單（client dialog，react-hook-form + zodResolver，類別／老師名稱／課程目錄下拉／備註；`<FieldError>`）
- [x] 3.3 `app/actions/learning-feedback.ts`：`submitLearningFeedback`（session＋zod → 建 pending）＋查自己回饋
- [x] 3.4 學員回饋列表（顯示狀態，僅本人）
- [x] 3.5 本人課程結業狀態欄（已/未結業/進行中）+ 未結業「一鍵回報」預帶課程/老師（`getMyLearningRecords` 補 `completedAt`，僅本人視角）
- [x] 3.6 個人頁 `/user/{spiritId}` 本人視角內嵌學習紀錄面板（他人視角維持原結業預覽）

## 4. 管理者端（learning-record-backfill-admin）

- [x] 4.1 `app/[locale]/(admin)/admin/learning-feedback` 頁（清單、狀態分頁、分頁；免自寫守衛）
- [x] 4.1b 後台首頁功能卡「學習歷程回饋」進入點（`getPendingFeedbackCount` 待處理數動態副標題）
- [x] 4.2 教師選擇器（`searchTeachersAction` 依姓名/teacherNo 搜尋，限講師）
- [x] 4.3 `approveMissingRecord`：建補建課程(標題含「（補建）」、completedAt=2025/09/01)＋結業報名 → approved＋`resultInviteId`
- [x] 4.4 `approveWrongTeacher`：`$transaction` 移除後台定位錯誤報名 → 正確老師建課並結業 → approved
- [x] 4.5 `fixNotGraduated`：後台定位報名設 `graduatedAt=2025/09/01`＋清 `nonGraduateReason`；班未結業補 `completedAt`
- [x] 4.6 `rejectFeedback`：狀態 rejected＋記錄 `resolvedById`/`resolvedAt`/`adminNote`
- [x] 4.7 冪等守衛：僅 pending 可處理（`loadPending`）

## 5. i18n

- [x] 5.1 `messages/zh-TW.json`＋`en.json` 新增 `learningFeedback` 命名空間＋`validation.feedback*`
- [x] 5.2 `npm run gen:zh-cn` 產生簡體（後台頁字串本階段維持繁體）

## 6. 驗證與品質

- [x] 6.1 `npx tsc --noEmit` 無錯、`npm run lint` 0 errors、`npm run build` 通過
- [ ] 6.2 手動驗證三類回饋各一次（建檔畢業／更正老師／改結業）＋婉拒＋冪等重複處理 — 需 DB（seed 後）

## 7. 文件與版本

- [x] 7.1 同步操作手冊：學員手冊（如何回饋）、管理者手冊（如何審核補資料）；更新檔首版本/日期
- [x] 7.2 `config/version.json` patch +1、更新 `README-AI.md`
