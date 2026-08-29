## 1. i18n 命名替換

- [x] 1.1 `messages/zh-TW.json`：`nav.learning` `"我的學習"` → `"分段式查經"`；`learning.pageTitle` `"我的學習"` → `"分段式查經"`；`learning.metaTitle` `"我的學習 — 啟動事工"` → `"分段式查經 — 啟動事工"`
- [x] 1.2 `messages/en.json`：對應 key → `"Sectional Bible Study"` / `"Sectional Bible Study"` / `"Sectional Bible Study — 啟動事工"`
- [x] 1.3 `npm run gen:zh-cn` 重新產生 `messages/zh-CN.json`
- [x] 1.4 `grep -rn "我的學習" app components` 確認前台元件無寫死中文「我的學習」（若有，改用 `t('learning.pageTitle')` 或對應 key）

## 2. `components/learning/lesson-grid.tsx` → 改寫並更名為 `lesson-accordion.tsx`

- [x] 2.1 `git mv components/learning/lesson-grid.tsx components/learning/lesson-accordion.tsx`；export `LessonGrid` → `LessonAccordion`；更新檔首註解（元件名、路徑、日期 2026-08-29）
- [x] 2.2 移除 `CourseCardGrid` import 與卡片牆；移除 grid 下方獨立 `<section>` + `<h3>{openLesson.title}</h3>`
- [x] 2.3 改為垂直清單：外層 `<div className="divide-y rounded-lg border">`，每課次一個 `<div>`；列頭 `<button type="button" onClick={() => setOpenKey(isOpen ? null : lesson.key)} aria-expanded={isOpen} className="flex w-full items-center gap-2 px-4 py-3 text-left hover:bg-muted/50 ...">`：`<span className="flex-1 text-sm font-medium">{lesson.title}</span>` ＋ 四態 Badge ＋ `IconChevronDown`（`isOpen && 'rotate-180'`）
- [x] 2.4 四態 Badge 沿用現有四段（`done` 綠實 / `noScripture` secondary / `partial` 琥珀實 / `todo` 琥珀 outline）＋文字 key（`lessonDone`/`lessonNoScripture`/`lessonPartial`/`lessonTodo`）；可抽同檔小元件 `LessonStateBadge`，不新增檔案
- [x] 2.5 展開內容：`isOpen && (<div className="border-t px-4 py-4"><LessonEntriesPanel courseCatalogId={outline.courseCatalogId} lesson={lesson} entriesBySlot={entriesBySlot} /></div>)`（`LessonEntriesPanel` 不動）
- [x] 2.6 `openKey` 單值 state（一次至多一課，沿用）；`lessons` 依 `order` 排序（沿用）
- [x] 2.7 `LS_KEY = \`learning:lastLesson:${outline.courseCatalogId}\``
- [x] 2.8 `useEffect(() => {...}, [])`：try `localStorage.getItem(LS_KEY)`；值對應到 `lessons.some(l => l.key === stored)` → `setOpenKey(stored)`；否則找第一個 `lessonFillState(l, filled) ∈ {'todo','partial'}` → `setOpenKey(l.key)`；否則不動（全收合）。整段包 `try/catch`
- [x] 2.9 `useEffect(() => { try { openKey ? localStorage.setItem(LS_KEY, openKey) : localStorage.removeItem(LS_KEY) } catch {} }, [openKey])`
- [x] 2.10 首次 render `openKey = null`（SSR 全收合，`useEffect` 後才展開，避免 hydration 警告）

## 3. `app/[locale]/(user)/user/[spiritId]/learning/[catalogId]/page.tsx`

- [x] 3.1 import：`LessonGrid` → `LessonAccordion`（`@/components/learning/lesson-accordion`）
- [x] 3.2 已解鎖分支 `<h1 className="text-2xl font-semibold">{catalog.label}</h1>` → `{t('pageTitle')} {catalog.label}`
- [x] 3.3 未解鎖分支的 `<h1>{catalog.label}</h1>` → 同樣加 `{t('pageTitle')} ` 前綴
- [x] 3.4 `<LessonGrid .../>` → `<LessonAccordion outline={outline} entriesBySlot={entriesBySlot} filledSlots={[...filledSlots]} />`
- [x] 3.5 `metadata.title` `'我的學習 — 啟動事工'` → `'分段式查經 — 啟動事工'`
- [x] 3.6 守衛、解鎖判定、進度數、孤兒筆記區塊：不動
- [x] 3.7 更新檔首註解日期為 `2026-08-29`

## 4. `app/[locale]/(user)/user/[spiritId]/learning/page.tsx`

- [x] 4.1 `metadata.title` `'我的學習 — 啟動事工'` → `'分段式查經 — 啟動事工'`
- [x] 4.2 `<h1>{t('pageTitle')}</h1>` 自動變「分段式查經」（不需改）；`IconNotebook`、`chooseCatalog`、`LearningCatalogGrid`：不動
- [x] 4.3 更新檔首註解日期為 `2026-08-29`

## 5. 殘留引用檢查

- [x] 5.1 `grep -rn "LessonGrid\|lesson-grid" app components` → 0（皆改為 `LessonAccordion` / `lesson-accordion`）

## 6. 驗證

- [x] 6.1 `npm run lint`：本次檔案 0 error
- [x] 6.2 `npx tsc --noEmit`：0 error
- [x] 6.3 `npm run build`：`✓ Compiled successfully`
- [~] 6.4 **（人工實測）** Topbar 項目、書籍選擇頁 `<h1>`、書籍子頁 `<h1>` 皆顯示「分段式查經」／「分段式查經 啟動靈人」；瀏覽器分頁標題為「分段式查經 — 啟動事工」
- [~] 6.5 **（人工實測）** 書籍子頁課次為垂直可收合清單（手機與桌機皆是），點列頭就地展開三格、一次一課
- [~] 6.6 **（人工實測）** 首次進某書（清空 localStorage）→ 自動展開第一個「待填寫／填寫中」課次；全部完成的書 → 全收合
- [~] 6.7 **（人工實測）** 手動展開第 N 課 → 重新整理 / 離開再回來 → 仍展開第 N 課；把它收合 → 重新整理 → 走 fallback（第一個未完成）
- [~] 6.8 **（人工實測）** 換另一本書 → 各自記各自的上次課次，互不干擾
- [~] 6.9 **（人工實測）** 迴歸：四態 Badge 顏色/文字、頂部「已完成 X / 共 Y 課」、孤兒筆記區塊、未解鎖鎖定訊息、他人／未登入 redirect 皆與改版前一致

## 7. 文件與版本號同步

- [x] 7.1 `doc/學員手冊.md`：第八章小節標題「我的學習（分段查經）」→「分段式查經」；內文入口路徑「頂部工具列的『我的學習』」→「『分段式查經』」；「第二層：課次卡片牆」相關敘述改為「垂直可收合清單、進頁自動展開上次或第一個未完成課次」；CR-002 加的頂部工具列按鈕列表「我的學習」→「分段式查經」；檔首版本 ＋ 日期
- [x] 7.2 `doc/老師手冊.md`／`doc/管理者操作手冊.md`：頂部工具列按鈕列表「我的學習」→「分段式查經」；檔首版本 ＋ 日期
- [x] 7.3 `config/version.json`：patch +1（以套用當下的值為基準，`0.1.185` → `0.1.186`；若 CR-SPEC-260829-003 先套用則接續為 `0.1.187`），`updatedAt` → `2026-08-29`
- [x] 7.4 `ai-context/03-architecture.md`：`components/learning/` 說明中 `lesson-grid.tsx` → `lesson-accordion.tsx`（垂直可收合清單、localStorage 記憶上次展開課次）；Topbar 條目「我的學習」→「分段式查經」
- [x] 7.5 `ai-context/07-current-tasks.md`：於「已完成」最前追加本 CR 記錄
- [x] 7.6 `README-AI.md`：版本行同步
