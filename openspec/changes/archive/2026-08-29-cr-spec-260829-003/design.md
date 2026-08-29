## Context

登入後 app 殼有兩個 layout，結構相同（`min-h-screen flex flex-col` → `<Topbar/>` → `<main>` → `<Footer/>`）：

- `app/[locale]/(user)/layout.tsx`
  - 已登入分支：`<main className="flex-1 px-4 py-6 sm:p-6">`（CR-SPEC-260829-002 後）
  - 未登入訪客看課程詳情的精簡分支（`isGuestRoute`，無 Topbar）：`<main className="flex-1 px-4 py-6 sm:p-6">`
- `app/[locale]/(admin)/layout.tsx`：`<main className="flex-1 p-6">`（CR-002 未動）

`components/layout/topbar.tsx`（`'use client'`）：`<header className="sticky top-0 z-50 bg-background flex h-16 items-center border-b px-4 gap-4">`，直接子層＝品牌 `<button>`（`flex min-w-0 flex-1 ...`）＋桌機按鈕群 `<div className="hidden md:flex ...">`＋手機 `<Sheet>`＋`<NotificationDrawer/>`。已 import `cn`？→ 否，需加。

`components/layout/footer.tsx`（server component）：`<footer className="py-4 text-center text-xs text-muted-foreground">v{version} · {updatedAt}</footer>`。

`lib/utils.ts`：只有 `cn()`。

無既有 OpenSpec capability 描述 app 殼容器寬度（`topbar`、`footer-version-info` 皆不涉及）。

本次＝5 個檔案的 className 調整 ＋ 一個共用常數，零邏輯變更。

## Goals / Non-Goals

**Goals：**
- 登入後 `(user)` / `(admin)` 的 `<main>` 內容區最大寬度 1280px、置中、兩側 gutter 沿用（手機 16px、`sm`+ 24px）。
- Topbar 內容列、Footer 內容對齊同一個 1280px 置中容器。
- ≤ 1280px 視窗零視覺變化。
- 1280 這個數字單一事實來源。

**Non-Goals：**
- 不改 `(guest)` layout、不改 `(user)` layout 的訪客精簡分支。
- 不改任何頁面內元件、不改內容的靠左排列。
- 不改 Topbar 的響應式收合行為（CR-001）、不改 Footer 內容。
- 不引入容器元件庫、不改 Tailwind config（用 arbitrary value `max-w-[1280px]`，不新增 theme token）。

## Decisions

### 1. 共用常數（1280 單一來源）

`lib/utils.ts` 末尾新增：

```ts
/** 登入後 app 殼內容容器：最大寬 1280px、置中、佔滿可用寬 */
export const APP_MAX_WIDTH = 'mx-auto w-full max-w-[1280px]'
```

- 用 `max-w-[1280px]` arbitrary value（＝ Tailwind `max-w-7xl` 在 16px root 下的值，但寫死 1280 更貼合需求字面、免依賴 root font-size）。
- `mx-auto` 置中、`w-full` 確保未達上限時撐滿父層。
- layout 是 server component、Topbar 是 client component——純字串常數兩邊都能 import，無 runtime。

### 2. `(user)/layout.tsx`

已登入分支：

```tsx
<main className={cn('flex-1', APP_MAX_WIDTH, 'px-4 py-6 sm:p-6')}>
```

（import `cn`, `APP_MAX_WIDTH`）。`sm:p-6` 仍提供 `sm`+ 的 24px 四邊內距；`max-w-[1280px] mx-auto` 疊加做置中。**訪客精簡分支不動**（維持 `flex-1 px-4 py-6 sm:p-6`）。

### 3. `(admin)/layout.tsx`

```tsx
<main className={cn('flex-1', APP_MAX_WIDTH, 'px-4 py-6 sm:p-6')}>
```

順帶把 `p-6` → `px-4 py-6 sm:p-6`，與 `(user)` 一致（手機水平內距 24→16px）。後台寬表格已各自包在 `overflow-x-auto`，容器封頂 1280 後照常內部捲動。

### 4. `topbar.tsx`：橫條滿版、內容列對齊容器

```tsx
<header className="sticky top-0 z-50 border-b bg-background">
  <div className={cn(APP_MAX_WIDTH, 'flex h-16 items-center gap-4 px-4 sm:px-6')}>
    {/* 品牌 button / 桌機按鈕群 / 手機 Sheet ... 原封不動 */}
    {/* NotificationDrawer 也放在這層內 */}
  </div>
</header>
```

- `<header>` 只留 `sticky top-0 z-50 border-b bg-background`（背景與底線仍延伸整個視窗寬）。
- 內層 `<div>` 提供 `h-16`、水平 `px-4 sm:px-6`（與 `<main>` gutter 對齊）、`max-w-[1280px] mx-auto`。
- 內部三塊（品牌 `<button>`、`hidden md:flex` 桌機群、`<Sheet>`）與 `<NotificationDrawer/>` **完全不改**，只是多一層 wrapper。
- import `cn`（新增）、`APP_MAX_WIDTH`。

### 5. `footer.tsx`：文字容器對齊

```tsx
<footer className="py-4">
  <div className={cn(APP_MAX_WIDTH, 'px-4 text-center text-xs text-muted-foreground sm:px-6')}>
    v{versionInfo.version} · {versionInfo.updatedAt}
  </div>
</footer>
```

- `<footer>` 留 `py-4`（滿版）；內層容器置中限寬 ＋ `text-center`（限寬後在容器內置中，視覺上仍近似整頁置中，寬螢幕時與內容區同框）。
- server component，import `cn`、`APP_MAX_WIDTH`。

### 6. 「靠左」如何維持

`max-w` + `mx-auto` 只作用在**容器**：容器本身在寬螢幕被置中、兩側留白；容器**內部**的頁面內容（標題、field rows、卡片 grid、表格）沿用既有 class，排列不變（本來靠左就還是靠左）。不需要對任何頁面內元件動刀。

## Risks / Trade-offs

- **[風險] `cn()` 疊 class 順序**：`flex-1` 與 `w-full` 同時存在——`flex-1` 已含 `flex-basis:0%`，`w-full` 為 `width:100%`；在 `flex flex-col` 的父層下兩者不衝突（主軸為縱向，`<main>` 橫向撐滿由 `w-full`/`align-stretch` 提供），`max-w` 封頂。實測驗證即可。
- **[風險] Topbar 多包一層 `<div>`**：`sticky` 仍在 `<header>` 上，行為不變；`z-50`、`border-b` 不變。手機 `Sheet`／`NotificationDrawer` 為 portal，不受 wrapper 影響。
- **[取捨] Footer 限寬後「置中」語意**：>1280px 時 Footer 文字會對齊到 1280 容器內置中（不是整個視窗置中）。與內容區同框，視覺一致，可接受。
- **[取捨] admin 順帶改手機內距**：屬 CR-002 未覆蓋 admin 的補齊，範圍極小、方向一致（手機優先）。
- **[風險] 後台既有假設整頁寬度的版面**：若某後台頁用了 `w-screen` 之類脫離容器的 class，會被 1280 容器裁切——掃過 `app/[locale]/(admin)` 確認無 `w-screen`/`100vw` 硬寫即可。

## Migration Plan

1. `lib/utils.ts`：加 `APP_MAX_WIDTH` 常數。
2. `app/[locale]/(user)/layout.tsx`：已登入分支 `<main>` 套 `cn('flex-1', APP_MAX_WIDTH, 'px-4 py-6 sm:p-6')`（import `cn`, `APP_MAX_WIDTH`）。
3. `app/[locale]/(admin)/layout.tsx`：`<main>` 同上（`p-6` → `px-4 py-6 sm:p-6` + 容器）。
4. `components/layout/topbar.tsx`：`<header>` 拆為「滿版外框 + 限寬內容列」。
5. `components/layout/footer.tsx`：文字包限寬容器。
6. `grep -rn "w-screen\|100vw\|max-w-screen" app/[locale]/(admin) app/[locale]/(user)` 確認無脫框硬寫。
7. `npm run lint`、`npx tsc --noEmit`、`npm run build`。
8. 實測：1920px（置中、兩側留白、內容靠左、Topbar/Footer 對齊）、1280px（剛好封頂、無留白）、1024/375px（與現況一致）。
9. `config/version.json` patch +1、`updatedAt`；`doc/` 三份手冊如有「版面寬度」敘述則補一句（多半無）；`ai-context/03-architecture.md` layout 說明、`07-current-tasks.md`、`README-AI.md` 版本行。

**Rollback**：純 className（5 檔）+ 1 常數，revert 即可，無資料/路由/邏輯影響。
