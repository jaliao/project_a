## Why

需求單 CR-SPEC-260829-004（提出人：廖柏嘉 Justin，2026-08-29）：**「優化我的學習」**。原文要點：

- 選單改名叫做「**分段式查經**」（CR-SPEC-260829-002 把入口從首頁區塊搬到 Topbar，項目名為「我的學習」）。
- 頁面標題「**分段式查經 啟動靈人**」（書籍子頁 `<h1>` = 「分段式查經」＋ 書名）。
- 在手機裡面，**每一個課次變成下拉式（可收合）列**——目前書籍子頁是「課次卡片牆 ＋ 點卡片在下方展開」，改為「垂直可收合清單，點列頭就地展開該課次的三個經文表單」。
- **預設展開＝上次的選擇**（用 `localStorage` 記住上次展開哪一課，每本書分開）。
- **如果沒有紀錄，就打開「要寫的作業」**——自動展開第一個未完成（`待填寫`／`填寫中`）的課次。

使用者澄清（2026-08-29）：可收合清單**手機與桌機都套用**（不再是卡片牆）；記憶用 `localStorage`，fallback＝第一個未完成課次。

## What Changes

### 1. 命名：「我的學習」→「分段式查經」

- **i18n**：`nav.learning`（Topbar 項目）、`learning.pageTitle`（書籍選擇頁 `<h1>`）、`learning.metaTitle` 由「我的學習」改為「分段式查經」；`messages/zh-TW.json` 來源 ＋ `messages/en.json`（`Sectional Bible Study`），`npm run gen:zh-cn` 重產簡體。
- **書籍子頁標題**：`/user/{spiritId}/learning/{catalogId}` 的 `<h1>{catalog.label}</h1>` → `<h1>{t('pageTitle')} {catalog.label}</h1>`（＝「分段式查經 啟動靈人」）；未解鎖分支的 `<h1>` 同步；`metadata.title` 由「我的學習 — 啟動事工」改為「分段式查經 — 啟動事工」（書籍選擇頁 `metadata` 同）。
- **文件**：`doc/學員手冊.md` 第八章小節標題與內文、`doc/老師手冊.md`／`doc/管理者操作手冊.md` 頂部工具列按鈕列表的「我的學習」→「分段式查經」；`ai-context`／`README-AI` 同步。

### 2. 書籍子頁：課次卡片牆 → 垂直可收合清單（手機＋桌機）

- **`components/learning/lesson-grid.tsx` → 改寫並更名 `lesson-accordion.tsx`**（`LessonGrid` → `LessonAccordion`）：
  - 不再用 `CourseCardGrid` 卡片牆 ＋ grid 下方單一 panel。改為**依 `order` 排序的垂直清單**，每個課次一個 `<div>`：列頭是可點的 `<button>`（課次標題 ＋ 四態 Badge ＋ `IconChevronDown`），展開時**就地**在列頭下方渲染 `<LessonEntriesPanel>`（該課次三個經文項目，維持 `grid-cols-1 sm:grid-cols-3`）。
  - **一次至多展開一個課次**（沿用現況；`openKey` 單值 state）。
  - 四態邊框／Badge 配色沿用現況（`done`/`noScripture` 綠、`partial` 琥珀、`todo` 虛線琥珀）。
  - props 不變（`outline` / `entriesBySlot` / `filledSlots`）。
- **`app/[locale]/(user)/user/[spiritId]/learning/[catalogId]/page.tsx`**：import `LessonGrid` → `LessonAccordion`；`<h1>` 加「分段式查經」前綴；其餘（守衛、解鎖判定、進度數、孤兒筆記區塊）不變。

### 3. 預設展開：localStorage 記憶 ＋ fallback

- `LessonAccordion` 內：
  - SSR / 首次 render：`openKey = null`（全收合），避免 hydration 不一致。
  - `useEffect`（掛載後、client only）：
    1. 讀 `localStorage['learning:lastLesson:' + outline.courseCatalogId]`；若其值對應到本大綱存在的 `lesson.key` → 展開該課。
    2. 否則：找**第一個**（依 `order`）`lessonFillState` 為 `todo` 或 `partial` 的課次 → 展開。
    3. 否則（全部 `done`／`noScripture`）→ 維持全收合。
  - `openKey` 變動時：非 null 寫入該 localStorage key、null 則移除。
  - localStorage 讀寫包 `try/catch`（無痕視窗 / 停用 storage 時靜默略過，清單照常可手動展開）。

## Capabilities

### Modified Capabilities
- `my-learning`：①「首頁『我的學習』入口」的 Topbar 項目名稱由「我的學習」改為「分段式查經」；②「書籍選擇頁與課次卡片牆」——書籍子頁的課次由「響應式卡片牆（`CourseCardGrid`）＋grid 下方單一展開區」改為「手機與桌機皆為垂直可收合清單，點列頭就地展開」；新增「預設展開哪一課」規則（`localStorage` 記憶上次展開課次；無紀錄則展開第一個未完成課次；全完成則全收合）；書籍子頁標題改為「分段式查經 ＋ 書名」。一次至多展開一課、展開直接見三格、頂部進度數計法不變。
- `topbar`：Topbar 分段查經入口的顯示名稱由「我的學習」改為「分段式查經」（導向、顯示條件不變）。

## Impact

- **Affected code**：
  - 修改：`app/[locale]/(user)/user/[spiritId]/learning/[catalogId]/page.tsx`、`app/[locale]/(user)/user/[spiritId]/learning/page.tsx`、`components/learning/lesson-grid.tsx`（改寫＋更名為 `lesson-accordion.tsx`）、`messages/zh-TW.json`／`messages/en.json`、`doc/學員手冊.md`／`doc/老師手冊.md`／`doc/管理者操作手冊.md`、`config/version.json`
  - 更名：`components/learning/lesson-grid.tsx` → `components/learning/lesson-accordion.tsx`
  - 產生：`messages/zh-CN.json`（`npm run gen:zh-cn`）
  - 不變：`components/learning/lesson-entries-panel.tsx`、`study-entry-form.tsx`、`study-entry-card.tsx`、`learning-catalog-grid.tsx`、`config/learning-outline.ts`、`lib/data/learning-study.ts`、所有 server action、Prisma schema
- **Database**：無 schema 變更。「上次展開的課次」存在瀏覽器 `localStorage`，不進 DB。
- **既有資料**：不涉及。
- **UI / 行為**：書籍子頁 `/user/{spiritId}/learning/{catalogId}` 的課次呈現方式改變（卡片牆 → 可收合清單，手機桌機一致）；進頁時自動展開上次的課次或第一個未完成課次。入口與頁標題文字改為「分段式查經」。無新頁面、無路由變更、無權限變更。
- **Route access**：不變。
- **Dependencies**：無新增套件。

## Open Questions

- 無。可收合清單套用範圍（手機＋桌機）、記憶方式（`localStorage`）、fallback（第一個未完成課次、全完成則全收合）皆已由使用者確認。

## 依賴備註

本 CR 的 `topbar` delta MODIFY 的是 CR-SPEC-260829-002 新增的「Topbar 我的學習入口」需求、`my-learning` delta MODIFY 的「首頁『我的學習』入口」為 CR-002 修改後版本——**假設 CR-002 先行封存（delta 已同步進主規格）**。若封存順序顛倒，`/opsx:sync` 時再行對齊。
