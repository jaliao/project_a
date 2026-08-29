## Context

「分段式查經」（原「我的學習」）現況（CR-SPEC-260828-007/009/010/012 + CR-260829-002 後）：

- **入口**：Topbar 項目「我的學習」（`nav.learning`，CR-002 加入桌機按鈕列 + 手機選單），導向 `/user/{spiritId}/learning`。
- **書籍選擇頁** `app/[locale]/(user)/user/[spiritId]/learning/page.tsx`：`<h1>{t('learning.pageTitle')}</h1>`（＝「我的學習」）＋ `IconNotebook`；`metadata.title` 寫死「我的學習 — 啟動事工」；`<LearningCatalogGrid>` 三張書籍卡。
- **書籍子頁** `app/[locale]/(user)/user/[spiritId]/learning/[catalogId]/page.tsx`：僅本人守衛；`<h1>{catalog.label}</h1>`（如「啟動靈人」）＋「已完成 X / 共 Y 課」；`<LessonGrid outline entriesBySlot filledSlots>`；底部孤兒筆記區塊。`metadata.title` 寫死「我的學習 — 啟動事工」。
- **`components/learning/lesson-grid.tsx`**（`'use client'`，`LessonGrid`）：
  - `CourseCardGrid`（＝個人首頁授課單元的響應式 grid）內，每個課次一張 `<button>` 卡片（標題 ＋ 四態 Badge ＋ `IconChevronDown`）；`useState<string | null>` 記 `openKey`，一次至多一張。
  - grid **下方**單獨 render `<section>`：`<h3>{openLesson.title}</h3>` ＋ `<LessonEntriesPanel courseCatalogId lesson entriesBySlot>`。
  - 四態來自 `lessonFillState(lesson, filled)`（`config/learning-outline.ts`：`'noScripture' | 'todo' | 'partial' | 'done'`）。
- **`components/learning/lesson-entries-panel.tsx`**：`lesson.scriptures` 為空 → `t('noScripture')`；否則 `grid grid-cols-1 gap-3 sm:grid-cols-3`，每格一張 `<Card>` 內 `StudyEntryCard`（已有筆記）或 `StudyEntryForm mode="create"`（尚無）。**本 CR 不動此檔**。
- i18n `learning` 命名空間（見 `messages/zh-TW.json`）：`pageTitle`「我的學習」、`metaTitle`「我的學習 — 啟動事工」、四態 `lessonDone/lessonPartial/lessonTodo/lessonNoScripture`、`progressCount`…

本 CR＝**命名替換 ＋ 書籍子頁課次呈現由卡片牆改為可收合清單 ＋ localStorage 記憶預設展開**，不動資料層、server action、schema、路由、`LessonEntriesPanel`。

## Goals / Non-Goals

**Goals：**
- 使用者可見的「我的學習」字樣全部改為「分段式查經」（Topbar 項目、書籍選擇頁標題、書籍子頁標題、meta title、手冊）。
- 書籍子頁課次改為**垂直可收合清單**（手機＋桌機一致），點列頭就地展開該課三格。
- 進書籍子頁時預設展開＝`localStorage` 記住的上次課次；無紀錄→第一個 `todo`/`partial` 課次；全完成→全收合。
- 一次至多展開一課、展開直接見三格、頂部「已完成 X / 共 Y 課」計法、四態配色、孤兒筆記區塊——皆不變。

**Non-Goals：**
- 不改 `LessonEntriesPanel` / `StudyEntryForm` / `StudyEntryCard` / `LearningCatalogGrid` 內部。
- 不改 `lib/data/learning-study.ts`、`config/learning-outline.ts`、任何 server action、Prisma schema。
- 不把「上次展開的課次」存進 DB（純 `localStorage`，per viewer / per catalog）。
- 不改書籍**選擇**頁的三張書籍卡呈現（仍是 `LearningCatalogGrid`）。
- 不改解鎖判定、守衛、redirect、鎖定訊息。

## Decisions

### 1. 命名替換（i18n 值改，不動 key）

`messages/zh-TW.json`：

| key | 舊 | 新 |
|---|---|---|
| `nav.learning` | 我的學習 | 分段式查經 |
| `learning.pageTitle` | 我的學習 | 分段式查經 |
| `learning.metaTitle` | 我的學習 — 啟動事工 | 分段式查經 — 啟動事工 |

`messages/en.json` 對應：`nav.learning` / `learning.pageTitle` = `Sectional Bible Study`、`learning.metaTitle` = `Sectional Bible Study — 啟動事工`。`npm run gen:zh-cn` 重產 `zh-CN`。

書籍子頁 `<h1>`：`{catalog.label}` → `{t('pageTitle')} {catalog.label}`（server component 用 `getTranslations('learning')`，已有 `t`）。未解鎖分支的 `<h1>` 同步。`metadata.title` 兩頁皆改字串（靜態 export，不引入 `generateMetadata`）。

### 2. `lesson-grid.tsx` → `lesson-accordion.tsx`（改寫為可收合清單）

更名檔案與 export（`LessonGrid` → `LessonAccordion`），`[catalogId]/page.tsx` 更新 import。props 不變：

```tsx
type Props = {
  outline: CatalogOutline
  entriesBySlot: Record<string, LearningStudyEntry[]>
  filledSlots: string[]
}
```

結構：

```tsx
const lessons = [...outline.lessons].sort((a, b) => a.order - b.order)
const filled = new Set(filledSlots)
const [openKey, setOpenKey] = useState<string | null>(null)

// 掛載後決定預設展開（見 Decision 3）
useEffect(() => { /* localStorage → fallback */ }, [])   // eslint-disable-line react-hooks/exhaustive-deps

// openKey 變動 → 同步 localStorage
useEffect(() => { /* write / remove */ }, [openKey])

return (
  <div className="divide-y rounded-lg border">
    {lessons.map((lesson) => {
      const state = lessonFillState(lesson, filled)
      const isOpen = openKey === lesson.key
      return (
        <div key={lesson.key}>
          <button
            type="button"
            onClick={() => setOpenKey(isOpen ? null : lesson.key)}
            aria-expanded={isOpen}
            className={cn(
              'flex w-full items-center gap-2 px-4 py-3 text-left transition-colors hover:bg-muted/50',
              isOpen && 'bg-muted/30'
            )}
          >
            <span className="flex-1 text-sm font-medium">{lesson.title}</span>
            {/* 四態 Badge：沿用現況（done/noScripture 綠、partial 琥珀、todo 虛線琥珀） */}
            <LessonStateBadge state={state} />
            <IconChevronDown className={cn('h-4 w-4 shrink-0 text-muted-foreground transition-transform', isOpen && 'rotate-180')} />
          </button>
          {isOpen && (
            <div className="border-t px-4 py-4">
              <LessonEntriesPanel
                courseCatalogId={outline.courseCatalogId}
                lesson={lesson}
                entriesBySlot={entriesBySlot}
              />
            </div>
          )}
        </div>
      )
    })}
  </div>
)
```

- **手機＋桌機同一結構**：`LessonEntriesPanel` 內部已 `grid-cols-1 sm:grid-cols-3`，桌機展開時三格並排、手機單欄。
- 四態 Badge 直接沿用 `lesson-grid.tsx` 現有的四段 `<Badge>`（可抽成同檔小元件 `LessonStateBadge` 或 inline，不新增檔案）。
- **移除**：`CourseCardGrid` import、卡片牆、grid 下方的獨立 `<section>` + `<h3>`（列頭本身已是課次標題）。
- 邊框色：列頭可依 `state` 加左側色條或 Badge 即可；不再需要整卡邊框。細節保留彈性，但 `done`/`noScripture` 需與 `todo`/`partial` 明顯有別（無障礙：靠 Badge 文字，非僅顏色）。

### 3. 預設展開邏輯（`useEffect`，client only）

```tsx
const LS_KEY = `learning:lastLesson:${outline.courseCatalogId}`

useEffect(() => {
  let stored: string | null = null
  try { stored = window.localStorage.getItem(LS_KEY) } catch {}
  const validStored = stored && lessons.some((l) => l.key === stored) ? stored : null
  if (validStored) { setOpenKey(validStored); return }
  // fallback：第一個未完成（todo / partial）
  const firstUndone = lessons.find((l) => {
    const s = lessonFillState(l, filled)
    return s === 'todo' || s === 'partial'
  })
  if (firstUndone) setOpenKey(firstUndone.key)
  // 全部 done/noScripture → 不動（維持 null，全收合）
}, [])

useEffect(() => {
  try {
    if (openKey) window.localStorage.setItem(LS_KEY, openKey)
    else window.localStorage.removeItem(LS_KEY)
  } catch {}
}, [openKey])
```

- **SSR 一致性**：伺服器與 client 首次 render 都 `openKey = null`（全收合），`useEffect` 掛載後才展開 → 無 hydration warning。展開會有一次 client 端的視覺跳動（可接受，屬常見 pattern）。
- `try/catch` 包全部 storage 存取：無痕視窗 / 停用 storage → 靜默略過，清單仍可手動點開。
- localStorage 只存一個 `lessonKey` 字串，per `courseCatalogId`；換書 = 換 key，互不干擾。
- 使用者手動收合（點開著的列頭）→ `openKey = null` → 移除 storage；下次進來走 fallback。

### 4. 不動清單

- `LessonEntriesPanel`、`StudyEntryForm`、`StudyEntryCard`：零改動。
- `[catalogId]/page.tsx` 的守衛、`getUnlockedLearningCatalogIds`、`getStudyEntriesForUser`、`getFilledOutlineSlots`、孤兒筆記分流與區塊：零改動。
- 頂部「已完成 X / 共 Y 課」（`isLessonCompleted` 計法）、四態語意（`lessonFillState`）：零改動。
- 書籍**選擇**頁的 `LearningCatalogGrid`、三張書籍卡：零改動（只有 `<h1>` 文字與 metadata 改）。

## Risks / Trade-offs

- **[取捨] 首屏無預設展開、掛載後才展開**：為了 SSR 一致性，第一個 render 全收合，`useEffect` 後跳出展開。屬可接受的閃動；若要 SSR 就展開需把「上次課次」放 cookie（增複雜度、跨裝置語意不清），本 CR 不採。
- **[風險] 課次很多時整頁很長**：一次至多展開一個、其餘只有列頭（`px-4 py-3`），比卡片牆更省空間，可接受。
- **[取捨] 桌機也變清單**：使用者明確要求手機＋桌機一致。桌機失去「一次看到所有課次狀態的牆面」，但清單列頭仍帶四態 Badge，掃視成本可接受。
- **[風險] `lesson-grid.tsx` 更名**：只有 `[catalogId]/page.tsx` 一個 import site；`grep` 確認無他處引用後更名。
- **[相容] 舊卡片牆的 e2e／截圖**：手冊若有截圖需更新（本 CR 文字說明為主）。

## Migration Plan

1. `messages/zh-TW.json`／`messages/en.json`：`nav.learning`、`learning.pageTitle`、`learning.metaTitle` 改值。`npm run gen:zh-cn`。
2. `components/learning/lesson-grid.tsx` → 改寫為可收合清單並更名 `lesson-accordion.tsx`（`LessonGrid` → `LessonAccordion`）；加 `useEffect` × 2（localStorage 讀 / 寫）。
3. `app/[locale]/(user)/user/[spiritId]/learning/[catalogId]/page.tsx`：import 改 `LessonAccordion`；`<h1>` 兩處加 `{t('pageTitle')} ` 前綴；`metadata.title` 改字串。
4. `app/[locale]/(user)/user/[spiritId]/learning/page.tsx`：`metadata.title` 改字串（`<h1>` 走 `t('pageTitle')` 自動變）。
5. `grep -rn "LessonGrid\|lesson-grid" app components` 確認無殘留引用。
6. `npm run lint`、`npx tsc --noEmit`、`npm run build`。
7. 實測：進書籍子頁預設展開上次課次／第一個未完成課次；手動展開他課 → reload 記住；手機桌機皆為清單；標題「分段式查經 啟動靈人」；Topbar 項目「分段式查經」。
8. `doc/` 三份手冊「我的學習」→「分段式查經」、學員手冊第八章小節改寫（可收合清單、預設展開）；各檔檔首版本 ＋ 日期；`config/version.json` patch +1、`updatedAt`。
9. `ai-context/03-architecture.md`（`lesson-grid` → `lesson-accordion` 說明）、`07-current-tasks.md`、`README-AI.md` 版本行。

**Rollback**：UI ＋ i18n 值 ＋ 一個元件改寫／更名，無 schema／資料／路由影響；revert commit 即可（localStorage 殘留 key 無害）。
