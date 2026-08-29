## Context

`components/layout/topbar.tsx`（`'use client'`）現況：

```tsx
<header className="sticky top-0 z-50 bg-background flex h-16 items-center border-b px-4 gap-4">
  <span className="font-semibold text-lg flex-1">{tc('appName')}</span>
  <div className="flex items-center gap-2">
    {/* 回首頁 / 媒合布告欄 / 後台管理(isAdmin) / 個人資料 / 聯絡管理者 / 訊息 / 訊息通知 */}
    {/* 每顆都是 <Button variant="ghost" size="icon"> + <Icon className="h-5 w-5" />，
        訊息 / 訊息通知 帶絕對定位未讀 Badge */}
    <NotificationDrawer open={isNotifOpen} onOpenChange={setIsNotifOpen} initialUnreadCount={unreadCount} />
  </div>
</header>
```

- Props：`unreadCount`、`unreadMessageCount`、`roles`、`spiritId`、`avatarUrl`（由 `(user)/layout.tsx` server 端算好傳入）。
- 衍生值：`isAdmin = canAccessAdmin(roles)`、`homeUrl = spiritId ? '/user/{spiritId}' : '/'`、`profileUrl = .../profile`、`inquiriesUrl = .../inquiries`。
- `useTranslations('nav')` 取按鈕文字（`home/profile/notifications/matchBoard/admin/help/messages`）、`useTranslations('common')` 取 `appName`。
- 個人資料按鈕：有 `avatarUrl` 顯示 `<UserAvatar size="sm" />`，否則 `<IconUser />`。
- 「訊息通知」按鈕 `onClick={() => setIsNotifOpen(true)}`，開啟同檔渲染的 `NotificationDrawer`（shadcn `Sheet` 包裝）。
- 破版點：`flex-1` 無 `min-w-0`/`truncate`；右側 7 顆 `size="icon"`（約 36–40px）恆定平鋪，手機塞不下 → 標題壓縮、按鈕溢出、Badge 被裁。

可用資源：`components/ui/sheet.tsx`（`Sheet/SheetTrigger/SheetClose/SheetContent/SheetHeader/SheetFooter/SheetTitle/SheetDescription`，`SheetContent` 支援 `side="right|left|top|bottom"`）、`@tabler/icons-react`（含 `IconMenu2`）。`(guest)` 登入頁的 Logo 為一段 inline SVG（`viewBox="0 0 24 24"` 的花體 B 字路徑）＋ `appName`。

本次是**單一元件的 RWD 重構 ＋ 一個 i18n key**，不動資料流、路由、權限。

## Goals / Non-Goals

**Goals：**
- 手機（`< md`）右側 7 顆按鈕收合為單一「選單」按鈕，點擊開 shadcn `Sheet`，內含相同動作清單（含未讀數）。
- 桌機（`>= md`）維持現狀，零視覺變更。
- Logo / 標題區窄螢幕不破版：`truncate`、不擠壓右側、可點回首頁、加上與登入頁一致的 SVG 標記。
- 未讀 Badge 不再被裁切。
- 全程使用既有 shadcn 元件，無新增依賴。

**Non-Goals：**
- 不改 `(user)/layout.tsx` 傳入 Topbar 的 props、不改各動作的目的地 / 顯示條件 / 權限。
- 不改 `(guest)` 登入 / 註冊 / 找回帳號等頁的 Logo lockup（另一範圍，使用者已排除）。
- 不改 `NotificationDrawer` 內部。
- 不新增圖片資產（沿用 inline SVG）。
- 不做側邊導航抽屜（sidebar）改版——僅收合現有頂部動作。
- 不動 `Footer`。

## Decisions

### 1. 斷點：Tailwind `md`（768px）

- `< md`：顯示「選單」按鈕（`md:hidden`），隱藏桌機按鈕群。
- `>= md`：桌機按鈕群 `hidden md:flex`，隱藏「選單」按鈕。
- 理由：7 顆 icon（約 300–320px）＋ Logo 在 `md` 以上可安穩並排；手機優先，斷點以下一律收合最單純。同一動作在任一寬度只呈現一份（避免重複 tab 焦點）。

### 2. 收合容器：shadcn `Sheet`（`side="right"`）

- 與 `NotificationDrawer` 一致的元件與滑入方向，體驗連貫；`Sheet` 內建 overlay、Esc、焦點鎖、`SheetTitle` 無障礙。
- 不用 `DropdownMenu`：清單含未讀數與較多列，Sheet 在手機的觸控目標與可讀性較佳。
- 結構：

```tsx
const [menuOpen, setMenuOpen] = useState(false)

// header 內、桌機按鈕群之外
<Sheet open={menuOpen} onOpenChange={setMenuOpen}>
  <SheetTrigger asChild>
    <Button variant="ghost" size="icon" className="md:hidden" aria-label={t('menu')} title={t('menu')}>
      <IconMenu2 className="h-5 w-5" />
    </Button>
  </SheetTrigger>
  <SheetContent side="right" className="w-72">
    <SheetHeader>
      <SheetTitle>{t('menu')}</SheetTitle>
    </SheetHeader>
    <nav className="mt-4 flex flex-col">
      <MenuRow icon={IconHome}          label={t('home')}       onClick={() => go(homeUrl)} />
      <MenuRow icon={IconClipboardList} label={t('matchBoard')} onClick={() => go('/match-board')} />
      {isAdmin && (
        <MenuRow icon={IconLayoutDashboard} label={t('admin')} onClick={() => go('/admin')} />
      )}
      <MenuRow icon={IconUser}          label={t('profile')}    onClick={() => go(profileUrl)} />
      <MenuRow icon={IconMessageCircle} label={t('help')}       onClick={() => go(inquiriesUrl)} />
      <MenuRow icon={IconMessage}       label={t('messages')}   badge={unreadMessageCount}
               onClick={() => go('/messages')} />
      <MenuRow icon={IconBell}          label={t('notifications')} badge={unreadCount}
               onClick={() => { setMenuOpen(false); setIsNotifOpen(true) }} />
    </nav>
  </SheetContent>
</Sheet>
```

- `go(href)`：`setMenuOpen(false); router.push(href)`。
- `MenuRow`（同檔內的區域元件或 inline map）：整列 `<button className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm hover:bg-accent">`；`icon` `h-5 w-5 shrink-0`；`label` `flex-1 text-left`；`badge`（number）`> 0` 時顯示 `<span className="ml-auto ...">{badge > 99 ? '99+' : badge}</span>`。
- 「訊息通知」列不導頁，關 Sheet ＋ 開 `NotificationDrawer`（與桌機一致）。
- `NotificationDrawer` 維持在 `header` 內渲染一次，兩種斷點共用。

### 3. Logo / 標題區

```tsx
<button
  type="button"
  onClick={() => router.push(homeUrl)}
  aria-label={t('home')}
  className="flex min-w-0 flex-1 items-center gap-2"
>
  <svg viewBox="0 0 24 24" aria-hidden className="h-5 w-5 shrink-0" /* 同 (guest) 登入頁路徑 */ >
    <path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3" />
  </svg>
  <span className="truncate text-lg font-semibold">{tc('appName')}</span>
</button>
```

- `min-w-0 flex-1` ＋ `truncate`：標題吸收剩餘寬度但可截斷，永不把右側按鈕擠出容器。
- SVG 用 `stroke="currentColor"` 系列屬性（比照登入頁），隨主題色；`aria-hidden`，可及名稱由 `aria-label={t('home')}` 提供。
- `header` 其餘（`sticky top-0 z-50 bg-background flex h-16 items-center border-b px-4 gap-4`）不變。

### 4. 桌機按鈕群：最小改動

- 現有 `<div className="flex items-center gap-2">` 改為 `<div className="hidden md:flex items-center gap-2">`。
- 內部 7 顆按鈕（含 `avatarUrl` 分支、絕對定位未讀 Badge、`title` 提示）**原封不動**。
- `NotificationDrawer` 移到此 `div` 之外（`header` 直接子層），確保手機（此 `div` `hidden`）仍能開通知。

### 5. i18n

- `messages/zh-TW.json` → `nav.menu = "選單"`；`messages/en.json` → `nav.menu = "Menu"`。
- 其餘文字（`home/profile/notifications/matchBoard/admin/help/messages`）皆已存在，手機列與桌機 `title` 共用同一組 key。
- `npm run gen:zh-cn` 重新產生 `messages/zh-CN.json`（`prebuild` 也會跑）。
- 元件內不寫死中文（新按鈕 `title`/`aria-label`、Sheet 標題、各列 label 全走 `t()`）。

### 6. 無障礙 / 焦點

- 「選單」按鈕：`aria-label` + `title`（`t('menu')`），`IconMenu2` `aria-hidden`（Radix `SheetTrigger` 預設處理展開狀態）。
- `SheetContent` 由 shadcn 提供焦點鎖與 `aria-describedby`；務必保留 `SheetTitle`（可視或 `sr-only`），避免 Radix 警告。
- 桌機群 `hidden md:flex`、手機鈕 `md:hidden`：同一動作不會同時有兩個可聚焦節點。
- 每個 `MenuRow` 是原生 `<button>`，鍵盤 / 讀屏可達；點擊後 Sheet 關閉，焦點回到觸發鈕（Radix 預設）。

## Risks / Trade-offs

- **[風險] SSR / hydration 抖動**：`hidden md:flex` / `md:hidden` 為純 CSS 斷點，不依賴 JS 量測，無 hydration 不一致；`Sheet` 僅在開啟時掛載內容。
- **[取捨] 手機少一步直達**：原本一鍵可點的動作，手機改為「選單 → 點列」兩步。屬收合的必然代價；換得不破版與可讀。桌機不受影響。
- **[風險] `md`（768px）邊界**：平板直立 768px 落在桌機側，7 顆按鈕 ＋ Logo 需容得下——實測 iPad 直立（768px）約 300px 按鈕 + padding 尚有餘裕；如個別語系 `appName` 過長由 `truncate` 吸收。
- **[取捨] Logo 仍為 inline SVG（非品牌圖檔）**：與登入頁一致、零資產成本；日後若有正式 Logo 檔再統一替換（另開單）。
- **[風險] 手冊截圖過時**：頂部工具列外觀在手機版改變，三份手冊若含頂欄截圖需補註（文字說明為主，截圖延後）。

## Migration Plan

1. `components/layout/topbar.tsx`：
   - `import { IconMenu2 }`、`import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'`。
   - 加 `const [menuOpen, setMenuOpen] = useState(false)`。
   - Logo 區改為可點 `<button>` ＋ SVG ＋ `truncate`（Decision 3）。
   - 現有按鈕群 `div` 加 `hidden md:flex`；把 `<NotificationDrawer />` 移出該 `div` 到 `header` 直接子層。
   - 新增手機「選單」`Sheet`（Decision 2），列出 7 個動作 ＋ 未讀 Badge。
2. `messages/zh-TW.json` / `messages/en.json`：加 `nav.menu`。
3. `npm run gen:zh-cn`。
4. `npm run lint`、`npx tsc --noEmit`、`npm run build`。
5. 手機（≤390px）/ 桌機（≥1024px）/ 邊界（768px）實測：破版消失、桌機不變、通知與訊息未讀數在選單內正確、Sheet 開關與導頁正常。
6. `doc/` 三份手冊頂欄段落補註；各檔檔首版本 ＋ 日期；`config/version.json` patch +1、`updatedAt`。

**Rollback**：純單檔 UI ＋ 一個 i18n key，revert commit 即可；無 schema / 資料 / 路由影響。
