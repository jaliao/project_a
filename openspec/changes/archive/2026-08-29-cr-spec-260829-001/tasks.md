## 1. `components/layout/topbar.tsx` — imports 與 state

- [x] 1.1 新增 import：`IconMenu2`（`@tabler/icons-react`，併入現有那行）
- [x] 1.2 新增 import：`Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger`（`@/components/ui/sheet`）
- [x] 1.3 元件內新增 `const [menuOpen, setMenuOpen] = useState(false)`（沿用既有 `useState` import）
- [x] 1.4 新增小工具 `const go = (href: string) => { setMenuOpen(false); router.push(href) }`
- [x] 1.5 更新檔首標準註解區塊日期為 `(Updated: 2026-08-29)`

## 2. Logo / 品牌區（取代現有 `<span ... flex-1>`）

- [x] 2.1 將 `<span className="font-semibold text-lg flex-1">{tc('appName')}</span>` 改為可點 `<button type="button" onClick={() => router.push(homeUrl)} aria-label={t('home')} className="flex min-w-0 flex-1 items-center gap-2">`
- [x] 2.2 內含 inline `<svg viewBox="0 0 24 24" aria-hidden className="h-5 w-5 shrink-0" ...>`（比照 `app/[locale]/(guest)/login/page.tsx` 的 Logo 路徑與 `stroke` 系列屬性）
- [x] 2.3 名稱文字 `<span className="truncate text-lg font-semibold">{tc('appName')}</span>`（`truncate` 確保窄螢幕不破版、不擠壓右側）
- [x] 2.4 `header` 既有 className（`sticky top-0 z-50 bg-background flex h-16 items-center border-b px-4 gap-4`）不變

## 3. 桌機按鈕群：加斷點、移出 NotificationDrawer

- [x] 3.1 現有 `<div className="flex items-center gap-2">`（含 7 顆按鈕）改為 `<div className="hidden md:flex items-center gap-2">`
- [x] 3.2 內部 7 顆按鈕（回首頁 / 媒合布告欄 / 後台管理〔`isAdmin`〕/ 個人資料〔`avatarUrl` 分支〕/ 聯絡管理者 / 訊息〔Badge〕/ 訊息通知〔Badge〕）**完全不改**
- [x] 3.3 將 `<NotificationDrawer open={isNotifOpen} onOpenChange={setIsNotifOpen} initialUnreadCount={unreadCount} />` 從該 `div` 內移出，改置於 `header` 直接子層（手機時該 `div` 為 `hidden`，通知仍須可開）

## 4. 手機「選單」Sheet

- [x] 4.1 在 `header` 內（桌機群之外）新增 `<Sheet open={menuOpen} onOpenChange={setMenuOpen}>`
- [x] 4.2 `<SheetTrigger asChild>` 包 `<Button variant="ghost" size="icon" className="md:hidden" aria-label={t('menu')} title={t('menu')}><IconMenu2 className="h-5 w-5" /></Button>`
- [x] 4.3 `<SheetContent side="right" className="w-72">` + `<SheetHeader><SheetTitle>{t('menu')}</SheetTitle></SheetHeader>`
- [x] 4.4 內層 `<nav className="flex flex-col px-2">`（`SheetContent` 本身已有 `gap-4`、無 padding，故以 `px-2` 取代 `mt-4`），以 `menuItems` map 依序渲染動作列（整列 `<button className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm hover:bg-accent">`，icon `h-5 w-5 shrink-0`，label `flex-1 text-left`）：
  - 回首頁 → `go(homeUrl)`（`IconHome` / `t('home')`）
  - 媒合布告欄 → `go('/match-board')`（`IconClipboardList` / `t('matchBoard')`）
  - 後台管理 → `go('/admin')`（`IconLayoutDashboard` / `t('admin')`）**僅 `isAdmin` 時渲染**
  - 個人資料 → `go(profileUrl)`（`IconUser` / `t('profile')`）
  - 聯絡管理者 → `go(inquiriesUrl)`（`IconMessageCircle` / `t('help')`）
  - 訊息 → `go('/messages')`（`IconMessage` / `t('messages')`），右側未讀 Badge：`unreadMessageCount > 0` 時 `<span className="ml-auto ...">{unreadMessageCount > 99 ? '99+' : unreadMessageCount}</span>`
  - 訊息通知 → `onClick={() => { setMenuOpen(false); setIsNotifOpen(true) }}`（`IconBell` / `t('notifications')`），右側未讀 Badge：`unreadCount > 0` 同上規則
- [x] 4.5 未讀 Badge 樣式與桌機一致（紅底白字圓角、`min-w-4 h-4 text-[10px]`），但改為 inline（`ml-auto`），不用絕對定位
- [x] 4.6 導頁列與通知列以 map 或區域 `MenuRow` 元件收斂，避免重複 JSX（同檔內，不新增檔案）

## 5. i18n

- [x] 5.1 `messages/zh-TW.json` → `nav.menu: "選單"`
- [x] 5.2 `messages/en.json` → `nav.menu: "Menu"`
- [x] 5.3 `npm run gen:zh-cn` 重新產生 `messages/zh-CN.json`（勿手改簡體）
- [x] 5.4 確認元件內新增字串（選單按鈕 `title`/`aria-label`、`SheetTitle`、各列 label）皆走 `t()`，無寫死中文

## 6. 驗證

- [x] 6.1 `npm run lint`：本次檔案 0 error
- [x] 6.2 `npx tsc --noEmit`：0 error
- [x] 6.3 `npm run build`（含 prebuild `gen:zh-cn`）：`✓ Compiled successfully`
- [~] 6.4 **（人工實測）** 手機（≤390px）：Topbar 僅見 Logo ＋「選單」鈕，無破版、Logo 過長時省略號截斷、無按鈕/紅點被裁
- [~] 6.5 **（人工實測）** 點「選單」開 Sheet：7 項（admin 帳號才 8 項）齊全，圖示＋文字；點「媒合布告欄」→ 導頁且 Sheet 關閉
- [~] 6.6 **（人工實測）** Sheet 內「訊息通知」列 → Sheet 關閉且 `NotificationDrawer` 開啟；「訊息」「訊息通知」未讀數正確顯示（含 `99+`、0 不顯示）
- [~] 6.7 **（人工實測）** 桌機（≥1024px）：7 顆平鋪按鈕外觀、順序、`title`、Badge 與改版前一致，無「選單」鈕
- [~] 6.8 **（人工實測）** 邊界 768px（iPad 直立）：桌機群可容納不溢出
- [~] 6.9 **（人工實測）** 非 admin 帳號：Sheet 內無「後台管理」項；未登入 / 暫停 / 臨時密碼流程不受影響（Topbar 僅登入後渲染）

## 7. 文件與版本號同步

- [x] 7.1 `doc/管理者操作手冊.md`：描述「頂部工具列 / 上方按鈕列」之章節補註「手機版（<768px）上述按鈕收合於右上『選單』內」；檔首版本標註 ＋ 日期（2026-08-29）
- [x] 7.2 `doc/老師手冊.md`：同 7.1 補註；檔首版本 ＋ 日期
- [x] 7.3 `doc/學員手冊.md`：同 7.1 補註；檔首版本 ＋ 日期
- [x] 7.4 `config/version.json`：patch +1（`0.1.183` → `0.1.184`），`updatedAt` → `2026-08-29`
- [x] 7.5 依 `.ai-rules.md` 更新 `ai-context/` 有異動章節（系統架構 / 開發規範中與 Topbar 相關處、`07-current-tasks.md` 追加本 CR 記錄於「已完成」最前）
