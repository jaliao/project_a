## Context

CR-SPEC-260828-003（已封存、已部署至 `project-a-stg`）建立了「我的學習」：

- 資料表 `LearningStudyEntry`（`userId`／`courseCatalogId`／`lessonKey`／`scriptureKey`／四內容欄位／時間戳），同一大綱位置可多筆。
- 大綱設定檔 `config/learning-outline.ts`：`LEARNING_OUTLINE: Record<catalogId, CatalogOutline>`，目前只有啟動靈人（id 1）的 `lesson-01`（無經文）與 `lesson-02`（3 經文：`mark-01`／`luke-02`／`matthew-27`）。
- 路由 `/user/{spiritId}/learning`（server，僅本人守衛）：把「已解鎖且有大綱」的目錄**整頁全展開**（`LearningOutlineSection`：目錄 → 課次 → 經文 → 筆記清單＋內嵌新增表單）。
- Server actions `app/actions/learning-study.ts`（`createStudyEntry`／`updateStudyEntry`／`deleteStudyEntry`）、Zod `lib/schemas/learning-study.ts`、資料層 `lib/data/learning-study.ts`（`getUnlockedLearningCatalogIds`／`getStudyEntriesForUser`／`outlineSlotKey`）。
- 元件 `study-entry-form.tsx`（總標題 `<Input>` ＋ 3 個 `<Textarea>`）、`study-entry-card.tsx`（顯示＋編輯＋`AlertDialog` 刪除）。
- 解鎖條件：該目錄有任一 `approved`、未取消、`invite.startedAt` 非空的報名。
- 個人首頁授課單元用 `CourseCardGrid`（`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3`）。

本次為 UI 改版（單頁全展開 → 兩層卡片）＋大綱資料補齊，**不動資料表與 server actions**。

## Goals / Non-Goals

**Goals：**
- 「我的學習」首頁 = 三張書籍卡片（啟動靈人／啟動豐盛／啟動得勝），可進入者導向子頁、其餘鎖定。
- 書籍子頁 `/learning/{catalogId}` = 該書課次卡片牆（`CourseCardGrid` RWD），課次卡片依「分段查經是否已填」兩態配色，點卡片同頁 accordion 展開該課次筆記 CRUD。
- 啟動靈人大綱補齊為 12 課（`lesson-01` ~ `lesson-12`）。
- 既有筆記（CR-003 已上線）零遷移。

**Non-Goals：**
- 不動 `LearningStudyEntry` 資料表、`createStudyEntry`／`updateStudyEntry`／`deleteStudyEntry`、Zod schema。
- 不建置啟動豐盛／啟動得勝的課次內容（卡片顯示鎖定）。
- 不導入富文本編輯器（維持 CR-003 的多行純文字）。
- 不做「完成度百分比」以外的進度統計／成就系統。
- 課次卡片配色不做三態（使用者選兩態）。

## Decisions

### 1. 大綱設定檔：啟動靈人補到 12 課

`config/learning-outline.ts` 的 `LEARNING_OUTLINE[1].lessons` 改為 12 筆。**`lesson-01`／`lesson-02` 的 `key` 不變**，只改 `title`：

- `lesson-01` → `title: '第一課：接受禮物'`，`scriptures: []`
- `lesson-02` → `title: '第二課：開箱上帝所賜的生命之禮'`（「裡」→「禮」、加冒號），`scriptures` 不變（`mark-01`／`luke-02`／`matthew-27`）

`lesson-03` ~ `lesson-12` 新增。`scriptureKey` 沿用「`<book slug>-<章數 2 位補零>`」慣例，於同一課次內唯一即可：

| lessonKey | title | scriptures（key → label） |
|---|---|---|
| lesson-03 | 第三課：開啟靈覺（一） | `psalm-01` 詩篇一 / `1john-03` 約翰一書三章 / `mark-11` 馬可福音十一章 |
| lesson-04 | 第四課：開啟靈覺（二） | `psalm-23` 詩篇二十三篇 / `matthew-06` 馬太福音六章 / `james-01` 雅各書一章 |
| lesson-05 | 第五課：開啟靈覺（三） | `james-02` 雅各書二章 / `james-03` 雅各書三章 / `james-04` 雅各書四章 |
| lesson-06 | 第六課：把屬靈化為實際（一） | `james-05` 雅各書五章 / `john-01` 約翰福音一章 / `john-02` 約翰福音二章 |
| lesson-07 | 第七課：把屬靈化為實際（二） | `john-03` 約翰福音三章 / `john-04` 約翰福音四章 / `john-05` 約翰福音五章 |
| lesson-08 | 第八課：靈人壓制（一） | `john-06` 約翰福音六章 / `john-07` 約翰福音七章 / `john-08` 約翰福音八章 |
| lesson-09 | 第九課：靈人壓制（二） | `john-11` 約翰福音十一章 / `john-12` 約翰福音十二章 / `john-13` 約翰福音十三章 |
| lesson-10 | 第十課：脫去舊人，穿上新人 | `john-14` 約翰福音十四章 / `john-15` 約翰福音十五章 / `john-16` 約翰福音十六章 |
| lesson-11 | 第十一課：離開才能進入豐盛 | `john-17` 約翰福音十七章 / `john-18` 約翰福音十八章 / `john-19` 約翰福音十九章 |
| lesson-12 | 第十二課：靈人全開啟 | （空） |

新增 `getAllCatalogSortMeta()` 非必要——書籍卡片頁直接 `prisma.courseCatalog.findMany({ orderBy: sortOrder })` 取三筆，用 `getCatalogOutline(id)` 判斷是否有大綱。

### 2. 課次「完成」判定（兩態）

新增資料層 `getLessonKeysWithEntries(userId, courseCatalogId): Promise<Set<string>>`：

```ts
const rows = await prisma.learningStudyEntry.findMany({
  where: { userId, courseCatalogId },
  select: { lessonKey: true },
  distinct: ['lessonKey'],
})
return new Set(rows.map(r => r.lessonKey))
```

課次卡片狀態：

- `lesson.scriptures.length === 0` → **完成**（無需填寫；卡片用完成色 ＋ 標記「無需填寫」）
- 否則 `lessonKeysWithEntries.has(lesson.key)` → **完成**
- 否則 → **未完成**（引導填寫）

「完成 / 未完成」以邊框色 ＋ 角落 Badge 呈現（完成＝`border-green-500` 系、未完成＝`border-amber-400` 系或 `border-dashed`），沿用專案既有 Tailwind 色階慣例；不新增顏色 token。書籍子頁頂部顯示「已完成 X / 共 Y 課」。

### 3. 路由與頁面

**`/user/{spiritId}/learning`（改寫，server component）**

1. 僅本人守衛（沿用現有：`session.user.spiritId.toLowerCase() !== spiritId` → `redirect`）。
2. `user.id`。
3. `catalogs = prisma.courseCatalog.findMany({ select: { id, label, sortOrder }, orderBy: { sortOrder: 'asc' } })`（三筆）。
4. `unlockedIds = getUnlockedLearningCatalogIds(user.id)`。
5. 每張書籍卡片：`hasOutline = !!getCatalogOutline(id)`、`unlocked = unlockedIds.includes(id)`、`canEnter = hasOutline && unlocked`。可進入者顯示課次完成度（`lessons.length` vs `getLessonKeysWithEntries` ∪ 無經文課次數）；不可進入者顯示鎖定原因（未開課 / 尚未開放）。
6. `<CourseCardGrid>` 包 `<LearningCatalogGrid catalogs={...} />`。

**`/user/{spiritId}/learning/{catalogId}`（新增，server component）**

1. 僅本人守衛。
2. `catalogId` 轉數字；非數字、無此 `CourseCatalog`、`!getCatalogOutline(catalogId)` → `redirect('/user/{spiritId}/learning')`。
3. `unlocked = getUnlockedLearningCatalogIds(user.id).includes(catalogId)`；未解鎖 → 顯示鎖定訊息（含「返回」連結），不查筆記。
4. 已解鎖：`outline = getCatalogOutline(catalogId)`、`grouped = getStudyEntriesForUser(user.id, catalogId)`（→ `entriesBySlot` ＋ `orphanEntries`，沿用現有分流）、`lessonKeysWithEntries = getLessonKeysWithEntries(...)`。
5. 頂部「返回」連結至 `/user/{spiritId}/learning`、標題 = 目錄 label、進度「X / Y 課」。
6. `<LessonGrid outline={...} entriesBySlot={...} orphanEntries={...} lessonKeysWithEntries={[...]} />`。

### 4. 元件拆分

- **`components/learning/learning-catalog-grid.tsx`（client）**：`props: { spiritId, catalogs: { id, label, canEnter, lockReason?, doneCount?, totalCount? }[] }`。每張卡片：`canEnter` → `<Link href={/user/{spiritId}/learning/{id}}>` 卡片；否則 `<div>` 鎖定卡片（`IconLock`、灰階、`cursor-not-allowed`、`title`/`aria` 提示）。卡片視覺比照 `CourseSessionCard` 的外框與間距（`rounded-lg border bg-card p-4`）。
- **`components/learning/lesson-grid.tsx`（client）**：`props: { outline: CatalogOutline, entriesBySlot, orphanEntries, lessonKeysWithEntries: string[] }`。`useState<string | null>` 記錄展開的 `lessonKey`。`<CourseCardGrid>` 包課次卡片；卡片點擊 `toggle`；展開時**於卡片牆下方**（非卡片內，避免 grid 破版）渲染 `<LessonEntriesPanel lesson={...} .../>`——即點某卡片時，該卡片高亮，panel 顯示在 grid 之後、佔滿寬度。
  - 課次卡片內容：`lesson.title`、狀態 Badge（完成／未完成／無需填寫）、`IconChevronDown` 旋轉。
- **`components/learning/lesson-entries-panel.tsx`（client）**：`props: { courseCatalogId, lesson: LessonOutline, entriesBySlot }`。內容 = 原 `learning-outline-section.tsx` 的「課次內層」：逐一經文項目 → 該 slot 筆記清單（`StudyEntryCard`）＋「新增分段查經」按鈕（`openSlot` state）＋ `StudyEntryForm mode="create"`。`lesson.scriptures` 為空 → 顯示 `t('noScripture')`。
- **`components/learning/learning-outline-section.tsx`**：刪除（其職責由上述三者接手）。孤兒筆記區塊移到 `/learning/{catalogId}` 頁尾（page 直接渲染，沿用 `StudyEntryCard`）。

### 5. i18n

`messages/zh-TW.json` `learning` 命名空間新增（`en.json` 對應）：

- `chooseCatalog`（首頁副標，如「選擇課程，開始你的分段查經」）
- `catalogLocked`（未開課鎖定）、`catalogComingSoon`（尚未開放大綱鎖定）
- `lessonDone` / `lessonTodo` / `lessonNoScripture`（課次卡片 Badge）
- `progressCount`（「已完成 {done} / 共 {total} 課」——用 next-intl ICU 參數）
- `backToCatalogs`（子頁返回書籍列表）
- 既有 `pageTitle`／`backToProfile`／`addEntry`／`noEntries`／`noScripture`／`orphanSectionTitle`／`orphanSectionHint`／欄位與按鈕 key 沿用；`lockedEmpty`／`intro` 視改版後是否仍用，保留或改文字。

### 6. RWD 一致性

書籍卡片牆與課次卡片牆一律以 `CourseCardGrid`（`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3`）包覆，達成「和個人首頁授課單元一樣」。展開的 `LessonEntriesPanel` 為 `col-span-full` 等寬區塊，不參與 grid 欄數。

## Risks / Trade-offs

- **[風險] 展開 panel 放在 grid 之後，使用者點的卡片與 panel 距離感**：以「被點卡片高亮 ＋ panel 標題重複課次名 ＋ 捲動至 panel」緩解；不採「卡片內展開」以免 grid 破版與 RWD 錯亂。
- **[風險] `scriptureKey` 與既有 `lesson-02` 的 `mark-01` 命名一致性**：新課次的 book slug（`john`／`james`／`psalm`／`1john`）沿用英文書卷縮寫慣例；`1john-03` 以數字開頭作為物件 key 合法。文件註記「key 發布後不可變更」。
- **[取捨] 大綱仍為設定檔**：豐盛／得勝補齊仍需改 code + 部署，符合 CR-003 既定方向。
- **[風險] CR-003 stg 既有筆記**：僅可能落在 `lesson-01`／`lesson-02`，key 未變，改版後照常顯示於對應課次的展開 panel。

## Migration Plan

1. `config/learning-outline.ts`：啟動靈人補 12 課（`lesson-01`/`lesson-02` 只改 title）。
2. `lib/data/learning-study.ts`：新增 `getLessonKeysWithEntries`。
3. 新增 `/user/[spiritId]/learning/[catalogId]/page.tsx`；改寫 `/user/[spiritId]/learning/page.tsx`。
4. 新增 `learning-catalog-grid.tsx`／`lesson-grid.tsx`／`lesson-entries-panel.tsx`；刪除 `learning-outline-section.tsx`。
5. `messages/zh-TW.json`／`messages/en.json` 補 `learning` key；`npm run gen:zh-cn`。
6. `npm run lint` ＋ `npm run build`。
7. `doc/學員手冊.md` 第八章「我的學習」小節更新；`config/version.json` patch +1、`updatedAt`。

**Rollback**：純 UI ＋ 設定檔，無 schema 變更，revert commit 即可；既有筆記資料不受影響。
