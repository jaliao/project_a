## Why

需求單 CR-SPEC-260829-003（提出人：廖柏嘉 Justin，2026-08-29）：**「全螢幕最寬」**。原文：

- 全螢幕最寬是 **1280 px**
- 左右兩邊留白
- 資訊排列**按照原本的方式 靠左**

現況：登入後 app 殼（`(user)` 與 `(admin)` layout）的 `<main>` 內容區沒有最大寬度限制，在寬螢幕（如 1920px）會整片撐滿，一行文字/表單拉得過長、閱讀動線差。CR-SPEC-260829-002 已把 `(user)` 的 `<main>` 手機內距收斂為 `px-4 py-6 sm:p-6`，但沒有處理寬螢幕上限。

## What Changes

**範圍（使用者確認）**：登入後 app 殼的 `(user)` 與 `(admin)` layout；Topbar 與 Footer 的內容也一起對齊 1280px 框。**不含** `(guest)` 登入/註冊等自帶滿版分割設計的頁；**不含** `(user)` layout 內「未登入訪客看課程詳情」的精簡分支。

- **新增共用常數**：`lib/utils.ts` 匯出 `APP_MAX_WIDTH = 'mx-auto w-full max-w-[1280px]'`（1280 為單一事實來源，供 layout / Topbar / Footer 套用）。
- **`app/[locale]/(user)/layout.tsx`**：已登入分支的 `<main className="flex-1 px-4 py-6 sm:p-6">` → 加 `APP_MAX_WIDTH`（`flex-1 mx-auto w-full max-w-[1280px] px-4 py-6 sm:p-6`）。訪客精簡分支（`isGuestRoute`）**不動**。
- **`app/[locale]/(admin)/layout.tsx`**：`<main className="flex-1 p-6">` → `flex-1 mx-auto w-full max-w-[1280px] px-4 py-6 sm:p-6`（順帶把手機水平內距對齊 `(user)`：`p-6` → `px-4 py-6 sm:p-6`）。
- **`components/layout/topbar.tsx`**：`<header>` 的**底線與背景維持滿版**（`sticky top-0 z-50 bg-background border-b`），但把內部那一列（Logo + 桌機按鈕群 + 手機選單）包進 `<div className={cn(APP_MAX_WIDTH, 'flex h-16 items-center gap-4 px-4 sm:px-6')}>`，讓 Logo 靠框左緣、按鈕靠框右緣，與 `<main>` 內容左右對齊。`h-16` 由內層容器提供。
- **`components/layout/footer.tsx`**：文字外層包 `<div className={cn(APP_MAX_WIDTH, 'px-4 sm:px-6')}>`，維持 `text-center`；`<footer>` 本身維持滿版 `py-4`。
- **內容靠左**：`max-w` + `mx-auto` 只限制容器寬度並置中容器，容器內部的文字/表單/卡片排列一律沿用現況（靠左），不改任何頁面內元件。
- **RWD**：視窗 ≤ 1280px（含所有手機/平板/一般筆電）時 `max-w-[1280px]` 不生效，表現與現況完全相同；只有 > 1280px 時內容置中、兩側出現留白。

## Capabilities

### Added Capabilities
- `app-shell`：登入後 app 殼（`(user)`／`(admin)`）的內容區、Topbar 內容列、Footer 內容 SHALL 對齊同一個最大寬度 1280px 的置中容器，兩側於寬螢幕留白，容器內排列維持靠左。

### Modified Capabilities
- `topbar`：Topbar `<header>` 的橫條（背景、底線、sticky）維持滿版，但其內容列 SHALL 對齊 app 殼的 1280px 置中容器（與 `<main>` 內容左右對齊）。

## Impact

- **Affected code**：
  - 修改：`lib/utils.ts`（新增常數）、`app/[locale]/(user)/layout.tsx`、`app/[locale]/(admin)/layout.tsx`、`components/layout/topbar.tsx`、`components/layout/footer.tsx`、`config/version.json`
  - 產生：無
  - 不變：所有頁面內元件、資料層、server action、Prisma schema、i18n 訊息
- **Database**：無 schema 變更。
- **既有資料**：不涉及。
- **UI / 行為**：
  - 視窗 > 1280px：登入後所有頁面（前台個人區 + 後台）內容置中、左右留白；Topbar 的 Logo/按鈕、Footer 文字隨之對齊。
  - 視窗 ≤ 1280px：無任何變化。
  - 後台寬表格：本身已在各自的 `overflow-x-auto` 容器內，容器達 1280px 後照常水平捲動，不受影響。
  - 無新頁面、無路由變更、無權限變更。
- **Route access**：不變。
- **Dependencies**：無新增套件。

## Open Questions

- 無。套用範圍（`(user)` + `(admin)`，不含 `(guest)` 與訪客精簡分支）、Topbar/Footer 一併對齊 1280 框，皆已由使用者確認。
