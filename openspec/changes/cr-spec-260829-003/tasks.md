## 1. 共用常數

- [x] 1.1 `lib/utils.ts` 末尾新增 `export const APP_MAX_WIDTH = 'mx-auto w-full max-w-[1280px]'`（附一行註解說明＝登入後 app 殼內容容器、最大寬 1280px）

## 2. `app/[locale]/(user)/layout.tsx`

- [x] 2.1 import `cn`（若未 import）與 `APP_MAX_WIDTH`（`@/lib/utils`）
- [x] 2.2 已登入分支：`<main className="flex-1 px-4 py-6 sm:p-6">` → `<main className={cn('flex-1', APP_MAX_WIDTH, 'px-4 py-6 sm:p-6')}>`
- [x] 2.3 訪客精簡分支（`isGuestRoute`）的 `<main>` **不動**
- [x] 2.4 更新檔首標準註解區塊日期為 `(Updated: 2026-08-29)`

## 3. `app/[locale]/(admin)/layout.tsx`

- [x] 3.1 import `cn`（`@/lib/utils` 已有？否則新增）與 `APP_MAX_WIDTH`
- [x] 3.2 `<main className="flex-1 p-6">` → `<main className={cn('flex-1', APP_MAX_WIDTH, 'px-4 py-6 sm:p-6')}>`（順帶把手機水平內距對齊 `(user)`）
- [x] 3.3 更新檔首標準註解區塊日期為 `(Updated: 2026-08-29)`

## 4. `components/layout/topbar.tsx`

- [x] 4.1 import `cn` 與 `APP_MAX_WIDTH`（`@/lib/utils`；`cn` 目前未 import）
- [x] 4.2 `<header>` className 由 `sticky top-0 z-50 bg-background flex h-16 items-center border-b px-4 gap-4` 改為 `sticky top-0 z-50 border-b bg-background`
- [x] 4.3 在 `<header>` 內新增一層 `<div className={cn(APP_MAX_WIDTH, 'flex h-16 items-center gap-4 px-4 sm:px-6')}>`，把原本的直接子層（品牌 `<button>`、`hidden md:flex` 桌機按鈕群、手機 `<Sheet>`、`<NotificationDrawer/>`）全部移入此 `<div>`
- [x] 4.4 內部三塊與 `NotificationDrawer` 內容**完全不改**（只是多一層 wrapper）
- [x] 4.5 更新檔首標準註解區塊日期為 `(Updated: 2026-08-29)`

## 5. `components/layout/footer.tsx`

- [x] 5.1 import `cn` 與 `APP_MAX_WIDTH`（`@/lib/utils`）
- [x] 5.2 `<footer className="py-4 text-center text-xs text-muted-foreground">{...}</footer>` → `<footer className="py-4"><div className={cn(APP_MAX_WIDTH, 'px-4 text-center text-xs text-muted-foreground sm:px-6')}>{...}</div></footer>`
- [x] 5.3 更新檔首標準註解區塊日期為 `(Updated: 2026-08-29)`

## 6. 防脫框檢查

- [x] 6.1 `grep -rn "w-screen\|100vw\|max-w-screen" "app/[locale]/(admin)" "app/[locale]/(user)"` 確認無硬寫整頁寬度的版面（若有，評估是否需保留在容器外）

## 7. 驗證

- [x] 7.1 `npm run lint`：本次檔案 0 error
- [x] 7.2 `npx tsc --noEmit`：0 error
- [x] 7.3 `npm run build`：`✓ Compiled successfully`
- [~] 7.4 **（人工實測）** 1920px：`(user)` 首頁與 `(admin)` 頁內容置中、左右留白、內容仍靠左；Topbar 的 Logo/按鈕、Footer 文字對齊 1280 框；`<header>` 底線仍滿版
- [~] 7.5 **（人工實測）** 1280px：內容剛好封頂、無左右留白（gutter 除外）
- [~] 7.6 **（人工實測）** 1024px / 768px / 375px：與改版前完全一致（含手機 Topbar「選單」、首頁排版）
- [~] 7.7 **（人工實測）** 後台含寬表格頁（members / activity-logs）：表格在既有 `overflow-x-auto` 內照常水平捲動，不破版
- [~] 7.8 **（人工實測）** 未登入看課程詳情精簡分支：不受影響（維持滿版扣 gutter）

## 8. 文件與版本號同步

- [x] 8.1 `config/version.json`：patch +1（`0.1.185` → `0.1.186`），`updatedAt` → `2026-08-29`
- [x] 8.2 `doc/` 三份手冊：`grep` 確認無「版面寬度／全螢幕」敘述；如有則補「內容最寬 1280px、寬螢幕置中」（多半無，無則不動，但仍依規範更新有異動手冊的檔首版本）
- [x] 8.3 `ai-context/03-architecture.md`：layout 說明補「(user)/(admin) `<main>` 及 Topbar/Footer 內容對齊 `APP_MAX_WIDTH`（max-w-[1280px] 置中）」
- [x] 8.4 `ai-context/07-current-tasks.md`：於「已完成」最前追加本 CR 記錄
- [x] 8.5 `README-AI.md`：版本行 → 0.1.186
