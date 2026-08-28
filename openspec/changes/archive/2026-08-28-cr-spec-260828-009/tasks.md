## 1. 大綱設定檔（啟動靈人 12 課）

- [x] 1.1 `config/learning-outline.ts`：`LEARNING_OUTLINE[1].lessons` 擴為 12 筆。`lesson-01` → `title: '第一課：接受禮物'`（`scriptures: []`）；`lesson-02` → `title: '第二課：開箱上帝所賜的生命之禮'`（scriptures 不變 `mark-01`/`luke-02`/`matthew-27`）
- [x] 1.2 新增 `lesson-03` ~ `lesson-12`（`order` 3~12、標題「第 N 課：<標題>」、經文 key/label 依 design.md 表格；`lesson-12` scriptures 為空）
- [x] 1.3 檔首註解更新：啟動靈人已建置 12 課；豐盛（2）／得勝（3）仍待補
- [x] 1.4 既有 helper（`getCatalogOutline`／`getOutlineCatalogIds`／`getLesson`／`getScripture`／`isValidOutlinePath`）不變，確認 12 課皆通過 `isValidOutlinePath`

## 2. 資料層

- [x] 2.1 `lib/data/learning-study.ts` 新增 `getLessonKeysWithEntries(userId, courseCatalogId): Promise<Set<string>>`（`learningStudyEntry.findMany` + `select: { lessonKey }` + `distinct: ['lessonKey']`，回傳 Set）
- [x] 2.2 既有 `getUnlockedLearningCatalogIds`／`getStudyEntriesForUser`／`outlineSlotKey` 不變

## 3. 路由頁

- [x] 3.1 改寫 `app/[locale]/(user)/user/[spiritId]/learning/page.tsx`（server）：僅本人守衛沿用；`prisma.courseCatalog.findMany({ orderBy: sortOrder })` 取三筆；`getUnlockedLearningCatalogIds`；每張書籍卡計算 `hasOutline` / `unlocked` / `canEnter` / `doneCount` / `totalCount`（doneCount = 無經文課次數 + `getLessonKeysWithEntries` 命中的有經文課次數）；`<CourseCardGrid>` 包 `<LearningCatalogGrid>`；頂部「返回學員頁面」連結
- [x] 3.2 新增 `app/[locale]/(user)/user/[spiritId]/learning/[catalogId]/page.tsx`（server）：僅本人守衛；`catalogId` 轉數字，非數字／無 `CourseCatalog`／`!getCatalogOutline` → `redirect('/user/{spiritId}/learning')`；未解鎖 → 顯示鎖定訊息＋返回連結（不查筆記）；已解鎖 → `getStudyEntriesForUser`（分流 `entriesBySlot` / `orphanEntries`）＋ `getLessonKeysWithEntries`；頂部返回書籍列表連結＋「X / Y 課」進度；`<LessonGrid>`；頁尾孤兒筆記區塊（沿用 `StudyEntryCard`）

## 4. 元件

- [x] 4.1 新增 `components/learning/learning-catalog-grid.tsx`（client）：`props { spiritId, catalogs: {id,label,canEnter,lockReason?,doneCount?,totalCount?}[] }`；`canEnter` → `<Link>` 卡片（`rounded-lg border bg-card p-4`，比照 `CourseSessionCard` 外觀，顯示 label＋「X/Y 課」）；否則鎖定卡片（`IconLock`、灰階、`cursor-not-allowed`、`aria`/`title` 提示 `lockReason`）
- [x] 4.2 新增 `components/learning/lesson-grid.tsx`（client）：`props { outline: CatalogOutline, entriesBySlot, orphanEntries, lessonKeysWithEntries: string[] }`；`useState<string|null>` 展開的 `lessonKey`（至多一個）；`<CourseCardGrid>` 包課次卡片（標題＋狀態 Badge：完成／未完成／無需填寫＋`IconChevronDown` 旋轉，被展開者高亮）；展開時於 grid **下方** `col-span-full` 區塊渲染 `<LessonEntriesPanel>`（避免破 grid 版）
- [x] 4.3 新增 `components/learning/lesson-entries-panel.tsx`（client）：`props { courseCatalogId, lesson: LessonOutline, entriesBySlot }`；內容 = 原 `learning-outline-section.tsx` 課次內層（逐經文項目 → `StudyEntryCard` 清單 ＋「新增分段查經」按鈕 ＋ `StudyEntryForm mode="create"`，`openSlot` state）；`lesson.scriptures` 為空 → `t('noScripture')`
- [x] 4.4 刪除 `components/learning/learning-outline-section.tsx`
- [x] 4.5 `study-entry-form.tsx`／`study-entry-card.tsx` 不變（確認 import 路徑仍正確）

## 5. i18n

- [x] 5.1 `messages/zh-TW.json` `learning` 新增：`chooseCatalog`、`catalogLocked`、`catalogComingSoon`、`lessonDone`、`lessonTodo`、`lessonNoScripture`、`progressCount`（ICU 參數 `{done}`/`{total}`）、`backToCatalogs`；檢視 `intro`／`lockedEmpty` 文字是否需配合雙層結構調整
- [x] 5.2 `messages/en.json` 補對應英文 key
- [x] 5.3 route 頁與新元件全以 `getTranslations('learning')`／`useTranslations('learning')` 取用；`npm run gen:zh-cn` 重新產生 `zh-CN`

## 6. 驗證

- [x] 6.1 `npm run lint`
- [x] 6.2 `npm run build`（含 prebuild `gen:zh-cn`）；`npx tsc --noEmit`
- [x] 6.3 **（待人工實測，stg 部署後）** 以「已開始啟動靈人報名」的測試帳號：`/user/{spiritId}/learning` 顯示三張書籍卡片，啟動靈人可點、豐盛／得勝鎖定
- [x] 6.4 **（待人工實測，stg 部署後）** 進 `/user/{spiritId}/learning/1`：12 張課次卡片、`CourseCardGrid` RWD、頂部「X / 共 12 課」；第一／十二課標「無需填寫」為完成態
- [x] 6.5 **（待人工實測，stg 部署後）** 點課次卡片 accordion 展開／收合（至多一個展開）；於經文項目新增／編輯／刪除筆記，該課次卡片配色由未完成 → 完成
- [x] 6.6 **（待人工實測，stg 部署後）** 直接開 `/user/{spiritId}/learning/999`／非數字 → 導回 `/learning`；未解鎖帳號開 `/learning/1` → 鎖定訊息；未登入 → `/login`
- [x] 6.7 **（待人工實測，stg 部署後）** CR-003 既有 `lesson-01`/`lesson-02` 筆記仍出現在對應課次展開區塊

## 7. 文件與版本號同步

- [x] 7.1 `doc/學員手冊.md` 第八章「我的學習（分段查經）」小節：更新為「選書籍 → 課次卡片牆（顏色代表是否已填）→ 點卡片展開填寫」雙層結構；檔首版本與日期
- [x] 7.2 `doc/老師手冊.md`／`doc/管理者操作手冊.md`：確認無涉及（純學員端），不需更新
- [x] 7.3 `config/version.json`：patch 版號 +1、`updatedAt` 更新為套用當日
