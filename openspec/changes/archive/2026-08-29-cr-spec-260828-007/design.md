## Context

「我的學習（分段查經）」現況（CR-SPEC-260828-003 建表與 CRUD、009 改兩層卡片、012 補啟動豐盛大綱，皆已封存）：

- 表 `LearningStudyEntry`（`userId`／`courseCatalogId`／`lessonKey`／`scriptureKey`／`mainTitle`／`subTitle`／`wordReceived`／`application`／`createdAt`／`updatedAt`），`@@index([userId, courseCatalogId, lessonKey, scriptureKey])`，**同一大綱位置允許多筆**。
- 大綱設定檔 `config/learning-outline.ts`：`LEARNING_OUTLINE: Record<catalogId, CatalogOutline>`；啟動靈人（1）／啟動豐盛（2）各 12 課，`getCatalogOutline` / `getScripture` / `isValidOutlinePath` 等 helper。
- 路由：`/user/{spiritId}/learning`（書籍卡片頁）、`/user/{spiritId}/learning/{catalogId}`（課次卡片牆，`LessonGrid` accordion，展開渲染 `LessonEntriesPanel`）。兩頁皆 server component、僅本人守衛。
- 資料層 `lib/data/learning-study.ts`：`getUnlockedLearningCatalogIds`、`getStudyEntriesForUser`（→ `Map<'lessonKey::scriptureKey', LearningStudyEntry[]>`，組內 `createdAt asc`）、`getLessonKeysWithEntries`（→ `Set<lessonKey>`）、`outlineSlotKey`。
- Server actions `app/actions/learning-study.ts`：`createStudyEntry`（session → Zod `createStudyEntrySchema` → `isValidOutlinePath` → 已解鎖 → `prisma.learningStudyEntry.create`）、`updateStudyEntry(id, input)`（擁有者檢查 → `studyEntryContentSchema` → `update`）、`deleteStudyEntry(id)`（擁有者檢查 → `delete`）。全部成功後 `revalidatePath('/[locale]/user/[spiritId]/learning', 'page')`。
- 元件：`lesson-grid.tsx`（`LessonState = 'done' | 'todo' | 'noScripture'`，`CourseCardGrid` 課次卡片＋徽章＋`IconChevronDown`，`useState` 記錄展開的 `lessonKey`）、`lesson-entries-panel.tsx`（逐經文項目：`StudyEntryCard` 清單 ＋「新增分段查經」按鈕 ＋ `openSlot` state 開 `StudyEntryForm mode="create"`）、`study-entry-form.tsx`（`<Input>` 總標題 ＋ 3 `<Textarea>`，`create`／`edit` 共用，`onDone`／`onCancel`）、`study-entry-card.tsx`（檢視 ＋ `IconPencil` 切編輯 ＋ `IconTrash` + `AlertDialog` 刪除 ＋「已編輯」）。
- 參考樣式「聯繫管理者」：`components/support-inquiry/inquiry-card.tsx`（`space-y-2`；分類 `text-sm font-medium`；狀態 `Badge`；內文 `text-sm whitespace-pre-wrap`；時間 `text-xs text-muted-foreground`；回覆區塊 `rounded-md bg-muted/50 px-3 py-2`）、`components/support-inquiry/contact-admin-cards.tsx`（`grid grid-cols-1 sm:grid-cols-3 gap-3`，每格 `rounded-lg border p-4`）。

本次是 **UI ／ server action 語意優化**，不動資料表、不動大綱設定檔、不動 Zod schema。

## Goals / Non-Goals

**Goals：**
- 課次卡片徽章四態：`無需填寫`／`待填寫`／`填寫中`／`已完成`。
- 課次展開後直接看到該課次三個經文項目的表單／檢視卡，排版與文字大小比照「聯繫管理者」。
- 一個經文項目「一格一筆」：可建立、可修改、**不可刪除**；存檔後為檢視模式。
- 既有資料零遷移；已存在的多筆（若有）不刪不顯示。

**Non-Goals：**
- 不加 `@@unique`、不寫資料 migration、不動 `LearningStudyEntry` 欄位。
- 不改大綱設定檔 `config/learning-outline.ts`（課次／經文內容不動）。
- 不改兩層路由結構、不改 accordion 互動（維持 CR-009；不做「四區塊分組全平鋪」）。
- 不改 Zod `lib/schemas/learning-study.ts`（欄位規則、字數上限不變）。
- 不導入富文本；維持多行純文字。
- 學員端不提供刪除；本 CR 不新增後台刪除入口。

## Decisions

### 1. 課次四態判定（改用「已填經文項目集合」）

新增資料層 helper 取代 `getLessonKeysWithEntries`：

```ts
// lib/data/learning-study.ts
/** 該使用者在某目錄下「已有至少一筆筆記」的經文位置集合，key = `lessonKey::scriptureKey` */
export async function getFilledOutlineSlots(
  userId: string,
  courseCatalogId: number
): Promise<Set<string>> {
  const rows = await prisma.learningStudyEntry.findMany({
    where: { userId, courseCatalogId },
    select: { lessonKey: true, scriptureKey: true },
    distinct: ['lessonKey', 'scriptureKey'],
  })
  return new Set(rows.map((r) => outlineSlotKey(r.lessonKey, r.scriptureKey)))
}
```

課次狀態（`lesson-grid.tsx`）：

```ts
type LessonState = 'noScripture' | 'todo' | 'partial' | 'done'

function lessonState(lesson: LessonOutline, filledSlots: Set<string>): LessonState {
  const total = lesson.scriptures.length
  if (total === 0) return 'noScripture'
  const filled = lesson.scriptures.filter((s) =>
    filledSlots.has(`${lesson.key}::${s.key}`)
  ).length
  if (filled === 0) return 'todo'
  if (filled < total) return 'partial'
  return 'done'
}
```

配色（沿用專案既有 Tailwind 色階，不新增 token；每態都有文字 Badge，非僅靠顏色）：

| 狀態 | 邊框 | Badge | i18n key |
|---|---|---|---|
| `noScripture` | `border-green-500/60` | `variant="secondary"` | `lessonNoScripture`（無需填寫） |
| `done` | `border-green-500/60` | `bg-green-600 text-white` | `lessonDone`（已完成） |
| `partial` | `border-amber-400` | `bg-amber-500 text-white` | `lessonPartial`（填寫中） |
| `todo` | `border-dashed border-amber-400` | `bg-amber-500 text-white`（或 `variant="outline"`） | `lessonTodo`（待填寫） |

（`partial` 與 `todo` 皆屬「未完成」色系，靠 Badge 文字與邊框虛實區分；實作時可微調，但 `done`／`noScripture` 必須明顯有別於未完成。）

### 2. 進度數：「已完成 X / 共 Y 課」

`done` 與 `noScripture` 皆計入。兩頁一致：

```ts
const doneCount = outline.lessons.filter((l) => {
  const st = lessonState(l, filledSlots)
  return st === 'done' || st === 'noScripture'
}).length
const totalCount = outline.lessons.length
```

- 書籍子頁 `/learning/{catalogId}`：`filledSlots = getFilledOutlineSlots(user.id, catalogId)`。
- 書籍卡片頁 `/learning`：每個可進入的目錄各呼叫一次 `getFilledOutlineSlots`（`Promise.all`，比照現況每目錄一次 `getLessonKeysWithEntries`）。

> 語意變更：CR-009 是「課次有任一筆即算完成」；本 CR 收緊為「三格全填才算 `done`」。書籍卡片頁的「X / Y 課」會隨之下降，屬預期。

### 3. 展開內層 panel 改寫（`lesson-entries-panel.tsx`）

`props` 不變（`courseCatalogId`、`lesson`、`entriesBySlot`）。

- `lesson.scriptures.length === 0` → `<p className="text-sm text-muted-foreground">{t('noScripture')}</p>`（不變）。
- 否則：

```tsx
<div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
  {lesson.scriptures.map((scripture) => {
    const slot = outlineSlotKey(lesson.key, scripture.key)
    const entry = (entriesBySlot[slot] ?? [])[0] ?? null   // 只取最早一筆
    return (
      <div key={scripture.key} className="space-y-2 rounded-lg border p-4">
        <p className="text-sm font-medium">{scripture.label}</p>
        {entry ? (
          <StudyEntryCard entry={entry} />
        ) : (
          <StudyEntryForm
            mode="create"
            courseCatalogId={courseCatalogId}
            lessonKey={lesson.key}
            scriptureKey={scripture.key}
          />
        )}
      </div>
    )
  })}
</div>
```

- 移除 `openSlot` state、`IconPlus`「新增分段查經」按鈕、`t('addEntry')`／`t('noEntries')`。
- 每格恆定：有筆記顯示檢視卡（可切編輯），無筆記顯示常駐建立表單。
- `entriesBySlot[slot]` 多於一筆時只用 `[0]`（最早建立），其餘不渲染（見 Decision 5）。

### 4. `study-entry-card.tsx`：移除刪除、對齊「聯繫管理者」文字級距

- 移除 `import { deleteStudyEntry }`、`AlertDialog*` import、`IconTrash`、`handleDelete`、`isPending`（若僅刪除用）。
- 保留 `IconPencil` 切換 `isEditing` → 內嵌 `<StudyEntryForm mode="edit" entryId initial onDone onCancel />`。
- 版面對齊 `InquiryCard`：外層 `space-y-2`（外框由 panel 的 `rounded-lg border p-4` 提供，卡片本身不再自帶 `border p-4`）；`mainTitle` 用 `text-sm font-medium`；`Field` 內文 `whitespace-pre-wrap text-sm`、label `text-xs font-medium text-muted-foreground`；時間列 `text-xs text-muted-foreground`，`filledAtLabel` ＋（`isEdited` 時）`edited` ＋ `updatedAtLabel`。
- 「編輯」以小字連結或 `size="sm" variant="ghost"` 按鈕呈現於卡片右上或底部，維持 `aria-label={t('edit')}`。

### 5. `createStudyEntry` 改為 idempotent（不加 DB 唯一鍵）

```ts
// app/actions/learning-study.ts — 驗證段不變（session / Zod / isValidOutlinePath / 已解鎖）
const existing = await prisma.learningStudyEntry.findFirst({
  where: {
    userId: session.user.id,
    courseCatalogId: d.courseCatalogId,
    lessonKey: d.lessonKey,
    scriptureKey: d.scriptureKey,
  },
  orderBy: { createdAt: 'asc' },
  select: { id: true },
})

if (existing) {
  await prisma.learningStudyEntry.update({
    where: { id: existing.id },
    data: normalizeContent(d),
  })
} else {
  await prisma.learningStudyEntry.create({
    data: {
      userId: session.user.id,
      courseCatalogId: d.courseCatalogId,
      lessonKey: d.lessonKey,
      scriptureKey: d.scriptureKey,
      ...normalizeContent(d),
    },
  })
}
revalidateLearning()
return { success: true, message: '已儲存' }
```

- 正常流程下 UI 只在「該格無筆記」時顯示建立表單，`existing` 幾乎必為 null；`findFirst` 保底避免併發／過期頁造成第二筆。
- 不加 `@@unique`：既有若已有多筆，唯一鍵會逼出去重 migration（資料遺失風險）；本專案已上線且「上線資料必須相容」。

### 6. `deleteStudyEntry` 移除

- `grep -rn "deleteStudyEntry"` 目前僅 `study-entry-card.tsx` 呼叫。移除該呼叫後一併刪除 `app/actions/learning-study.ts` 的 `deleteStudyEntry` export。
- 若日後 `grep` 發現後台匯入／修正工具（如 `learning-record-backfill-admin`）有引用，則 **保留 server action**、僅移除學員端 UI 呼叫（本 CR 範圍以學員端為準）。

### 7. `study-entry-form.tsx`：create 模式常駐

- `CreateProps` 移除 `onDone`／`onCancel` 的「取消」需求：`create` 模式不渲染「取消」按鈕（表單本就常駐，取消無意義）；成功後靠 `revalidatePath` 重繪成檢視卡，`onDone` 可留空實作或直接移除（`edit` 模式仍需 `onDone`／`onCancel` 收合回檢視卡）。
- 型別調整：`CommonProps` 的 `onDone`／`onCancel` 移到 `EditProps`；`CreateProps` 只留 `mode`／`courseCatalogId`／`lessonKey`／`scriptureKey`。
- 欄位、`zodResolver(studyEntryContentSchema)`、`<FieldError>`、toast 行為不變。
- 送出：`create` 成功 toast `res.message`（「已儲存」），無 `onDone` 呼叫也可（頁面 revalidate）。

### 8. 路由頁調整

- `/user/{spiritId}/learning/{catalogId}/page.tsx`：`getLessonKeysWithEntries` → `getFilledOutlineSlots`；`doneCount` 依 Decision 2；`<LessonGrid outline entriesBySlot filledSlots={[...]} />`（prop 由 `lessonKeysWithEntries` 改名 `filledSlots`）。孤兒筆記區塊沿用（`StudyEntryCard`，現已無刪除）。守衛、redirect、鎖定訊息不變。
- `/user/{spiritId}/learning/page.tsx`：`getLessonKeysWithEntries` → `getFilledOutlineSlots`；`doneCount` 依 Decision 2。`LearningCatalogGrid` props 不變（仍傳 `doneCount`／`totalCount`）。

### 9. i18n

`messages/zh-TW.json` `learning`：

- 新增：`lessonPartial: "填寫中"`
- 改：`lessonDone: "已填寫"` → `"已完成"`
- 移除：`addEntry`、`noEntries`、`delete`、`deleteConfirmTitle`、`deleteConfirmBody`、`deleteConfirmAction`
- 保留：`lessonTodo`（待填寫）、`lessonNoScripture`（無需填寫）、`progressCount`、`fieldMainTitle`／`fieldSubTitle`／`fieldWordReceived`／`fieldApplication`、`mainTitlePlaceholder`、`save`／`cancel`／`edit`、`edited`／`filledAtLabel`／`updatedAtLabel`、`noScripture`、`orphanSectionTitle`／`orphanSectionHint`、`genericError`
- `mainTitlePlaceholder`（「為這則分段查經下一個標題」）可留；`intro`／`lockedEmpty`／`chooseCatalog`／`catalogLocked`／`catalogComingSoon`／`backToCatalogs`／`backToProfile` 不變。

`messages/en.json` 同步；`npm run gen:zh-cn` 產生 `zh-CN`。所有文案以 `t()` 取用，不寫死中文。

## Risks / Trade-offs

- **[取捨] 不加唯一鍵**：資料層仍可能出現同一格多筆（僅併發／舊資料）。以 `createStudyEntry` idempotent ＋ UI 只取 `[0]` 吸收；代價是 DB 可能殘留隱形列，可接受（零遺失優先）。
- **[風險] 進度數下降**：CR-009「有一筆即完成」→ 本 CR「三格全填」。使用者已知悉此為四態的必然結果；`filledCount/total` 的「填寫中」正是引導補齊的訊號。
- **[風險] 常駐表單使展開 panel 變高**：一課最多三個 `<Input>` + 九個 `<Textarea>`。以 `sm:grid-cols-3` 三欄並排、`rows={2}`／`rows={4}` 維持與現況一致的密度；accordion 一次只展開一課，可接受。
- **[風險] `study-entry-form.tsx` 型別重構**（`onDone`／`onCancel` 移入 `EditProps`）可能牽動 `study-entry-card.tsx` 的 `mode="edit"` 呼叫——同批修改、`tsc --noEmit` 驗證。
- **[取捨] 孤兒筆記仍用 `StudyEntryCard`**：現無刪除後，孤兒筆記只能編輯內容、無法清除。屬極少數（大綱調整才會產生），可接受；日後如需清理再另開後台單。

## Migration Plan

1. `lib/data/learning-study.ts`：新增 `getFilledOutlineSlots`、移除 `getLessonKeysWithEntries`。
2. `app/actions/learning-study.ts`：`createStudyEntry` 改 idempotent；移除 `deleteStudyEntry`（先 `grep` 確認呼叫端）。
3. `components/learning/study-entry-form.tsx`：型別重構（`create` 無 `onDone`／`onCancel`、不渲染取消）。
4. `components/learning/study-entry-card.tsx`：移除刪除 UI、對齊 `InquiryCard` 級距。
5. `components/learning/lesson-entries-panel.tsx`：改寫為「三格 × 檢視卡／常駐表單」網格。
6. `components/learning/lesson-grid.tsx`：`LessonState` 四態、徽章與配色、prop 改名 `filledSlots`。
7. 兩個 `learning` 路由頁：改用 `getFilledOutlineSlots`、`doneCount` 依四態。
8. `messages/zh-TW.json`／`messages/en.json`：`lessonPartial` 新增、`lessonDone` 改文案、移除刪除／新增相關 key；`npm run gen:zh-cn`。
9. `npm run lint`、`npx tsc --noEmit`、`npm run build`。
10. `doc/學員手冊.md` 第八章更新；`config/version.json` patch +1、`updatedAt`。

**Rollback**：純 UI ＋ server action 語意，無 schema 變更，revert commit 即可；既有筆記資料不受影響（未刪任何列）。
