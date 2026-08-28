## Context

`/user/{spiritId}/page.tsx`（server component）基本資料區塊渲染 `<CourseProgressCards allCourses={allCourses} certificates={certificates} />`：

- `allCourses = await getAllCourses()` — 三個 `CourseCatalog`（啟動靈人 id 1／豐盛 2／得勝 3），依 `sortOrder`（`CourseCatalogEntry = { id, label, ... }`）。
- `certificates = await getMyCompletionCertificates(user.id)` — `CompletionCertificate[] = { courseCatalogId, title, teacherName, graduatedAt: Date }`，每 `courseCatalogId` 最新一筆。
- `allEnrollments = await getMyEnrollments(user.id)` — 已存在；每筆含 `courseCatalogId`／`status`（`'pending' | 'approved'`）／`startedAt`／`completedAt`／`cancelledAt`。`enrollments = allEnrollments.filter(e => !e.cancelledAt)`。
- `id` 為路由參數（小寫 spiritId）；`isOwnPage = session?.user?.spiritId?.toLowerCase() === id`。

`components/learning/course-progress-cards.tsx`（server 純顯示元件，無 `"use client"`，寫死繁體）：目前 `cert` 有無 → 完成 / 未完成兩態。

**CR-007（同分支、已實作、未提交）既有：**
- `lib/data/learning-study.ts`
  - `getFilledOutlineSlots(userId, courseCatalogId): Promise<Set<string>>` — `findMany` + `distinct: ['lessonKey','scriptureKey']` → `Set<lessonKey::scriptureKey>`。
  - `getUnlockedLearningCatalogIds`／`getStudyEntriesForUser`／`outlineSlotKey` 不變。
  - `getLessonKeysWithEntries` **已移除**。
- `config/learning-outline.ts`
  - `getCatalogOutline(id)`、`getOutlineCatalogIds()`（目前 `[1, 2]`）。
  - `LessonFillState = 'noScripture' | 'todo' | 'partial' | 'done'`。
  - `lessonFillState(lesson, filledSlots)` — 三格全填→`done`、1~2 格→`partial`、0 格→`todo`、無經文→`noScripture`。
  - `isLessonCompleted(lesson, filledSlots)` — `state === 'done' || state === 'noScripture'`。
- 書籍卡片頁 `learning/page.tsx`：`doneCount = outline.lessons.filter(l => isLessonCompleted(l, filledSlots)).length`、`totalCount = outline.lessons.length`。
- `/user/{spiritId}/learning/{catalogId}` 子頁：僅本人；catalogId 無大綱 → redirect 回 `/learning`；頂部顯示「已完成 X / 共 Y 課」（同 `isLessonCompleted` 口徑）。

`student-profile-page` spec「基本資料區塊 — 學習進度三卡」需求規定：三卡固定顯示、已結業完成樣式＋學業完成時間、未結業虛線/灰階、**公開、本人他人一致**、無獨立「結業證明」區塊。

## Goals / Non-Goals

**Goals：**
- 三卡由兩態改為三態：未完成 ｜ 進行中 ｜ 已完成（課程參與層級）。
- 已完成／進行中卡顯示「已完成 X / 共 Y 課」作業完成度，**與 CR-007 的 `isLessonCompleted` 口徑完全一致**（首頁三卡、書籍卡片頁、書籍子頁頂部三處同數字）。
- 進行中／已完成 + 有大綱 + 本人視角 → 整卡可點，連 `/user/{spiritId}/learning/{catalogId}`。

**Non-Goals：**
- 不動 `LearningStudyEntry` 表、server actions、Zod、`/learning` 兩層頁面、`config/learning-outline.ts`、解鎖判定邏輯。
- 不做 i18n 遷移（本頁與元件維持既有寫死繁體）。
- 不改「三卡固定顯示三個目錄、公開、他人一致」的既有規則。
- 不在他人視角開放卡片點擊（`/learning` 僅本人）。
- **不重新定義「作業完成度」的算法**——直接複用 CR-007 的 `getFilledOutlineSlots` + `isLessonCompleted`。

## Decisions

### 1. 三態判定（課程參與層級，於 `page.tsx` server 端算）

```ts
const certByCatalogId = new Map(certificates.map(c => [c.courseCatalogId, c]))

// 進行中 = 已解鎖（approved + 未取消 + startedAt 非空）但尚未結業
const startedApprovedCatalogIds = new Set(
  enrollments
    .filter(e => e.status === 'approved' && e.startedAt != null)
    .map(e => e.courseCatalogId)
)
const inProgressCatalogIds = [...startedApprovedCatalogIds].filter(id => !certByCatalogId.has(id))
```

- **已完成**：`certByCatalogId.has(id)`。
- **進行中**：`inProgressCatalogIds.includes(id)`。
- **未完成**：其餘。

（`enrollments` 已排除 `cancelledAt`；判定條件與 `getUnlockedLearningCatalogIds` 等價，但直接用 `getMyEnrollments` 結果就地算，省一次 DB round-trip。）

### 2. 作業完成度 — 新增 `getLearningProgressByCatalog`

`lib/data/learning-study.ts`：

```ts
import { getCatalogOutline, getOutlineCatalogIds, isLessonCompleted } from '@/config/learning-outline'

/**
 * 各「有大綱」課程目錄的分段查經作業完成度。
 * done 口徑與書籍卡片頁／子頁頂部一致（isLessonCompleted：done 或 noScripture）。
 */
export async function getLearningProgressByCatalog(
  userId: string
): Promise<Record<number, { done: number; total: number }>> {
  const result: Record<number, { done: number; total: number }> = {}
  for (const catalogId of getOutlineCatalogIds()) {
    const outline = getCatalogOutline(catalogId)
    if (!outline) continue
    const filledSlots = await getFilledOutlineSlots(userId, catalogId)
    result[catalogId] = {
      total: outline.lessons.length,
      done: outline.lessons.filter(l => isLessonCompleted(l, filledSlots)).length,
    }
  }
  return result
}
```

- 目前 `getOutlineCatalogIds()` = `[1, 2]` → 兩次 `getFilledOutlineSlots` 查詢；`distinct` 輕量、資料量小、可接受。
- 得勝（3，無大綱）→ `result` 無此 key → 卡片不顯示完成度列、不可點。
- 本人與他人視角**都算**（Q2：公開）。他人視角時 `user.id` 為頁主 id。

`page.tsx`：`const progressByCatalog = await getLearningProgressByCatalog(user.id)`。

### 3. `CourseProgressCards` 三態渲染

props 擴充：

```ts
interface CourseProgressCardsProps {
  allCourses: CourseCatalogEntry[]
  certificates: CompletionCertificate[]
  inProgressCatalogIds: number[]
  progressByCatalog: Record<number, { done: number; total: number }>
  spiritId: string
  isOwnPage: boolean
}
```

每張卡（`course` of `allCourses`，`id = course.id`）：

```ts
const cert = certByCatalogId.get(id)              // 已完成
const isInProgress = inProgressCatalogIds.includes(id)
const progress = progressByCatalog[id]            // 有大綱才有
const linkable = isOwnPage && (cert || isInProgress) && progress != null
```

| 狀態 | icon | 外框樣式 | 內容 |
|---|---|---|---|
| 已完成（`cert`） | `IconCircleCheck`（text-primary） | `border-primary/30 bg-primary/5` | 目錄名、`學業完成：YYYY/MM/DD`、`{cert.title} · {cert.teacherName}`、完成度列 |
| 進行中（`isInProgress`） | `IconCircleDotted`（text-blue-600） | `border-blue-500/40` | 目錄名、`進行中`、完成度列 |
| 未完成 | `IconCircleDashed`（muted） | `border-dashed text-muted-foreground` | 目錄名、`未完成` |

- 完成度列（`progress != null` 且卡片為已完成或進行中）：`已完成 {progress.done} / 共 {progress.total} 課`，`text-xs text-muted-foreground`，`pl-6`。
- 外層容器：`linkable` → `<Link href={\`/user/${spiritId}/learning/${id}\`} className="{基礎樣式} hover:bg-muted/40 transition-colors">`，卡片標題列右側加 `IconChevronRight`（`h-4 w-4 text-muted-foreground`）提示可點；否則 `<div className="{基礎樣式}">`。
- grid 版面 `grid grid-cols-1 gap-3 sm:grid-cols-3` 不變。
- 元件維持 server component、無 `"use client"`；`next/link` 的 `Link` 可於 server component 使用。

### 4. capability

`student-profile-page` 的「基本資料區塊 — 學習進度三卡」需求 MODIFIED：兩態 → 三態、新增作業完成度（對齊 CR-007 四態口徑）、新增本人視角可連入「我的學習」。既有「固定顯示三目錄、公開、他人一致、無獨立結業證明區塊」規則保留。

## Risks / Trade-offs

- **[風險] 他人視角顯示頁主的作業完成度**：使用者已明確要求公開（Q2）；與三卡既有「公開」規則一致，不新增隱私面。
- **[風險] 完成度口徑與「我的學習」不一致**：已透過**直接複用** CR-007 的 `getFilledOutlineSlots` + `isLessonCompleted` 消除——三處必為同數字。
- **[風險] 「已完成」但該目錄無大綱（如未來得勝結業）**：`linkable` 含 `progress != null`；無大綱 → 不可點、不顯示完成度，卡片僅顯示「已完成 + 學業完成時間」，行為安全。得勝目前 `isActive: false`、無人結業。
- **[效能] `page.tsx` 多兩次 `getFilledOutlineSlots` 查詢**：`distinct` 輕量；他人視角也跑（頁主資料）。可接受。
- 純 UI + 一個資料層函式，無 schema 變更，revert commit 即回滾。

## Migration Plan

1. `lib/data/learning-study.ts`：新增 `getLearningProgressByCatalog(userId)`（複用 `getFilledOutlineSlots` + `config/learning-outline` 的 `isLessonCompleted`）。
2. `components/learning/course-progress-cards.tsx`：改寫為三態 + 完成度列 + 可點卡片；擴充 props。
3. `app/[locale]/(user)/user/[spiritId]/page.tsx`：算 `inProgressCatalogIds`、呼叫 `getLearningProgressByCatalog`，傳入 `<CourseProgressCards>`（含 `spiritId`、`isOwnPage`）。
4. `npm run lint` + `npx tsc --noEmit` + `npm run build`。
5. `doc/學員手冊.md` 相關小節更新；`config/version.json` patch +1、`updatedAt`。

**Rollback**：純 UI + 資料層新增函式，revert commit 即可，無資料影響。
