## 1. 資料層與設定檔

- [x] 1.1 `prisma/schema/learning-study.prisma`：新增 `LearningStudyEntry` model（`id`／`userId`＋FK Cascade／`courseCatalogId`＋FK／`lessonKey`／`scriptureKey`／`mainTitle`／`subTitle?`／`wordReceived?`／`application?`／`createdAt`／`updatedAt`，`@@index([userId, courseCatalogId, lessonKey, scriptureKey])`，`@@map("learning_study_entries")`）
- [x] 1.2 `prisma/schema/user.prisma`：`User` 加 `learningStudyEntries LearningStudyEntry[]` 反向關聯
- [x] 1.3 `prisma/schema/course-catalog.prisma`：`CourseCatalog` 加 `learningStudyEntries LearningStudyEntry[]` 反向關聯
- [~] 1.4 **migration 檔已產生、尚未套用到執行中的 DB**：`prisma/migrations/20260828060944_add_learning_study_entries/migration.sql` 已由 `prisma migrate dev` 產出（乾淨的單一 `CREATE TABLE learning_study_entries` ＋ index ＋ 2 FK，與 `make schema-update` 產物一致），`prisma generate` 已更新 client 型別。**未套用**：`make schema-update` 依賴的 `web` 容器未起，且 host `127.0.0.1:5432` 上可連到的 Postgres 已與 migration 歷史嚴重漂移（缺 `admin_action_logs`／`support_inquiries`／`push_subscriptions`／`users.roles` 等數十項、`20260605024409_add_ship_mode_material_shipment` 標記失敗），`prisma migrate dev` 會要求 reset（清空資料），**已中止未動 DB**。**待辦**：使用者於自己的終端 `make dev` 起容器 → `make schema-update`（會偵測並套用此既有 migration，不會重複產生）或正式站 `make prisma-prd-deploy`；接著實測第 6.3–6.7 項。此 migration 為 additive 新表、正式資料相容。
- [x] 1.5 `config/learning-outline.ts`：型別（`ScriptureOutline`／`LessonOutline`／`CatalogOutline`）＋ `LEARNING_OUTLINE` 常數（啟動靈人 id 1：第一課無經文、第二課「開箱上帝所賜的生命之裡」三經文）＋ helper（`getCatalogOutline`／`getOutlineCatalogIds`／`getLesson`／`getScripture`／`isValidOutlinePath`）。已註記 key 發布後不可變更
- [x] 1.6 `lib/schemas/learning-study.ts`：`studyEntryContentSchema`（`mainTitle` 必填 1–200＝`validation.studyMainTitleRequired`／`validation.studyMainTitleTooLong`；三個副文本選填 max 5000＝`validation.studyFieldTooLong`）＋ `createStudyEntrySchema`（再加 `courseCatalogId`/`lessonKey`/`scriptureKey`）
- [x] 1.7 `lib/data/learning-study.ts`：`getUnlockedLearningCatalogIds(userId)`（直接 `inviteEnrollment.findMany` where `approved` + `invite.cancelledAt=null` + `invite.startedAt not null`，取 distinct `courseCatalogId`）、`getStudyEntriesForUser(userId, catalogId)`（回傳 `Map<'lessonKey::scriptureKey', LearningStudyEntry[]>`，`createdAt asc`）、`outlineSlotKey()`

## 2. Server Actions

- [x] 2.1 `app/actions/learning-study.ts` `createStudyEntry`：`auth()` → Zod（`createStudyEntrySchema`）→ `isValidOutlinePath`（涵蓋「經文項目非空」）→ `courseCatalogId ∈ getUnlockedLearningCatalogIds` → `prisma.learningStudyEntry.create` → `revalidatePath('/[locale]/user/[spiritId]/learning', 'page')`；標準 `ActionResponse`；內容欄位空字串正規化為 null
- [x] 2.2 `updateStudyEntry(id, input)`：`auth()` → 讀該筆確認 `userId === session.user.id`（否則 `{ success:false, message:'無權限' }`）→ Zod（`studyEntryContentSchema`）→ `update` 僅四內容欄位 → revalidate
- [x] 2.3 `deleteStudyEntry(id)`：`auth()` → 擁有權檢查 → `delete` → revalidate
- [x] 2.4 `update`／`delete` 不重驗解鎖條件（允許持續維護既有筆記）

## 3. 路由頁與元件

- [x] 3.1 `app/[locale]/(user)/user/[spiritId]/learning/page.tsx`（server）：僅本人守衛（`session.user.spiritId.toLowerCase() !== spiritId` → `redirect(selfId ? '/user/{selfId}/learning' : '/login')`）；查 `user.id`；`getOutlineCatalogIds()` ∩ `getUnlockedLearningCatalogIds`；`courseCatalog.findMany` 取 label；每目錄 `getStudyEntriesForUser`；渲染目錄→課次→經文→筆記清單＋新增；頂部「返回學員頁面」連結；`sections.length === 0` 時未解鎖空狀態
- [x] 3.2 `components/learning/learning-outline-section.tsx`（client）：單一目錄大綱＋分組筆記渲染，`openSlot` state 管理新增表單開合
- [x] 3.3 `components/learning/study-entry-form.tsx`（client）：四欄位（總標題 `<Input>`、其餘 `<Textarea>`）＋ RHF＋`zodResolver(studyEntryContentSchema)`＋`<FieldError>`；`mode` create/edit 共用；`useTransition`；呼叫對應 action，toast 成功／失敗
- [x] 3.4 `components/learning/study-entry-card.tsx`（client）：顯示一筆（四欄位 `whitespace-pre-wrap`、`filledAtLabel` 建立時間、`updatedAt - createdAt > 1s` 顯示「已編輯」＋更新時間）、編輯（切換為 `StudyEntryForm`）／刪除（`AlertDialog` 二次確認 → `deleteStudyEntry`）
- [x] 3.5 `app/[locale]/(user)/user/[spiritId]/page.tsx`：`isOwnPage` 時新增「我的學習」單元（`IconNotebook`＋標題＋`IconChevronRight`，整列 `Link` 至 `/user/${id}/learning`，比照「聯繫管理者」單元；此頁全頁維持既有寫死繁體風格，單元標題亦寫死）
- [x] 3.6 大綱找不到對應 key 的「孤兒」筆記：page 分流至 `orphanEntries`，`LearningOutlineSection` 以「其他（大綱已調整）」區塊顯示，不隱藏資料

## 4. i18n

- [x] 4.1 `messages/zh-TW.json` 新增 `learning` 命名空間（27 key）：頁面／meta 標題、返回連結、intro、未解鎖空狀態、無筆記空狀態、無經文提示、孤兒區塊、四欄位標籤、按鈕（新增分段查經／儲存／取消／編輯／刪除）、刪除確認三段、填寫／更新時間標籤、已編輯標記、generic error
- [x] 4.2 `messages/zh-TW.json` `validation` 新增 `studyMainTitleRequired`／`studyMainTitleTooLong`／`studyFieldTooLong`
- [x] 4.3 `messages/en.json` 補對應英文 key（learning 27 + validation 3）
- [x] 4.4 route 頁與三個元件全以 `getTranslations('learning')`／`useTranslations('learning')` 取用；`npm run gen:zh-cn` 已重新產生 `messages/zh-CN.json`（首頁單元標題「我的學習」比照該頁其他區塊維持寫死）

## 5. Seed（選）

- [ ] 5.1 **未做（選做，且需 DB）**：`prisma/seed.ts` 示範筆記——待 1.4 migration 完成後可另行補（非必要）

## 6. 驗證

- [x] 6.1 `npm run lint`：0 errors（16 個既有 warning，皆非本次新檔）
- [x] 6.2 `npm run build`：`✓ Compiled successfully`、107/107 頁產生、新路由 `ƒ /[locale]/user/[spiritId]/learning` 已註冊；`npx tsc --noEmit` 0 errors
- [ ] 6.3 **待辦（需 1.4）**：有「已開始啟動靈人報名」的測試帳號 → `/user/{spiritId}/learning` 顯示啟動靈人大綱；第一課無填寫入口、第二課三經文各可新增
- [ ] 6.4 **待辦（需 1.4）**：新增／編輯（顯示「已編輯」）／刪除（二次確認）；同一經文多筆並存；總標題留空被擋
- [ ] 6.5 **待辦（需 1.4）**：未解鎖帳號 → 未解鎖空狀態；直接呼叫 `createStudyEntry` 帶未解鎖 `courseCatalogId` 被伺服器端拒絕
- [ ] 6.6 **待辦（需 1.4）**：存取他人 `/user/{otherSpiritId}/learning` → 導回本人；未登入 → 導 `/login`
- [ ] 6.7 **待辦（需 1.4）**：非擁有者對他人筆記 id 呼叫 `updateStudyEntry`／`deleteStudyEntry` → 回傳無權限、資料未異動

## 7. 文件與版本號同步

- [x] 7.1 `doc/學員手冊.md`：第八章新增「我的學習（分段查經）」小節（進入路徑、解鎖條件、大綱、四欄位、可多筆／可編輯刪除、與課程不綁定）；檔首版本 v0.1.173 → v0.1.177（2026-08-28）
- [x] 7.2 `doc/老師手冊.md`／`doc/管理者操作手冊.md`：grep 確認無「我的學習」／「分段查經」相關內容，此功能純學員端無老師／管理者介面，不需更新、不 bump
- [x] 7.3 `config/version.json`：`0.1.176` → `0.1.177`，`updatedAt` 維持 `2026-08-28`
