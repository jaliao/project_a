## Why

需求單 CR-SPEC-260829-001（提出人：廖柏嘉 Justin，2026-08-29）：**「透過 shadcn 套件，解決目前手機選單和 Logo 的破版問題。」**

現況 `components/layout/topbar.tsx`（登入後每一頁固定渲染的頂部工具列）在手機寬度會破版：

- 左側標題（Logo）用 `<span className="font-semibold text-lg flex-1">{appName}</span>`——`flex-1` 讓它吃滿剩餘空間，但**沒有 `min-w-0` / `truncate`**，窄螢幕下與右側按鈕群互相擠壓。
- 右側**固定平鋪 7 顆 `size="icon"` 按鈕**（回首頁、媒合布告欄、後台管理〔admin〕、個人資料、聯絡管理者、訊息、訊息通知），在 ~360–390px 的手機上總寬超出可用空間，造成：標題被壓成一兩個字、按鈕溢出容器 / 被裁切、未讀紅點角標（`-top-0.5 -right-0.5`）超出邊界被切掉。
- 沒有任何「手機選單」收合機制，也沒有實際的 Logo 標記（僅純文字）。

專案為手機優先開發，此為每頁可見的基礎破版，需優先修掉。

## What Changes

**範圍：只改 `components/layout/topbar.tsx` 與 i18n 文案（使用者確認）**。不動 `(user)` layout 的資料傳入、不動各按鈕的目的地 / 權限邏輯、不動 `(guest)` 登入頁的 Logo。

- **手機（`< md`，<768px）：右側按鈕群收合成單一「選單」按鈕**
  - 新增一顆 `IconMenu2` ghost icon 按鈕（`md:hidden`），點擊開啟 **shadcn `Sheet`**（`side="right"`，專案既有 `components/ui/sheet.tsx`，`NotificationDrawer` 已在用同一元件）。
  - Sheet 內以**垂直清單**列出與桌機相同的動作項目，每列為「圖示 ＋ 文字標籤」整列可點（`回首頁 / 媒合布告欄 / 後台管理〔admin 才顯示〕/ 個人資料 / 聯絡管理者 / 訊息 / 訊息通知`）。
  - `訊息`、`訊息通知`兩列在文字右側顯示未讀數 Badge（沿用 `unreadMessageCount` / `unreadCount`，`> 99` 顯示 `99+`）。
  - 點任一導頁列 → 先 `router.push(...)` 再關閉 Sheet；點「訊息通知」列 → 關閉 Sheet 並 `setIsNotifOpen(true)`（開啟既有 `NotificationDrawer`，行為與桌機一致）。
- **桌機（`>= md`）：維持現狀**——現有的 7 顆平鋪 icon 按鈕群組加上 `hidden md:flex`，外觀、順序、`title` 提示、Badge 全部不變。
- **Logo / 標題排版修正**
  - 品牌區改為 `flex items-center gap-2 min-w-0 flex-1`，`appName` 文字加 `truncate`，窄螢幕維持單行不破版、不擠壓右側。
  - 品牌區可點擊回首頁（`homeUrl`，等同「回首頁」按鈕目的地），加 `aria-label`。
  - 於 `appName` 前加入與 `(guest)` 登入頁一致的 inline SVG 標記（`h-5 w-5 shrink-0`，`aria-hidden`），成為實際的 Logo lockup；`header` 高度 `h-16`、`sticky`、`z-50`、`border-b` 不變。
- **i18n（`nav` 命名空間）**
  - 新增 `nav.menu`（「選單」 / 「Menu」）作為手機選單按鈕的 `title` / `aria-label` 與 Sheet 標題。
  - `messages/zh-TW.json` 繁體來源 ＋ `messages/en.json` 對應；`npm run gen:zh-cn` 重新產生 `zh-CN`。既有 `nav.home/profile/notifications/matchBoard/admin/help/messages` 直接複用。
- **無障礙**：手機選單按鈕有可辨識名稱；Sheet 有 `SheetTitle`；每列動作為 `<button>` / `<Link>`，鍵盤可達；斷點切換不造成同一動作出現兩份可見焦點（桌機群 `hidden md:flex`、手機按鈕 `md:hidden`）。
- **文件 / 版本**：三份操作手冊（`doc/管理者操作手冊.md`、`doc/老師手冊.md`、`doc/學員手冊.md`）凡描述「頂部工具列 / 上方按鈕」之章節，補一句「手機版上述按鈕收合於右上『選單』內」；各檔檔首版本標註 ＋ 日期同步；`config/version.json` patch +1、`updatedAt` 改當日（apply 時）。

## Capabilities

### Modified Capabilities
- `topbar`：新增「手機版（<768px）右側操作按鈕群收合為單一『選單』按鈕，點擊開啟 shadcn Sheet 呈現同樣的動作清單；桌機維持平鋪」的行為規格，並補「品牌 / Logo 區在窄螢幕不破版（truncate、不擠壓按鈕）」規格。既有各按鈕的目的地與顯示條件不變。

## Impact

- **Affected code**：
  - 修改：`components/layout/topbar.tsx`（唯一的元件檔改動）、`messages/zh-TW.json`、`messages/en.json`、`doc/管理者操作手冊.md`、`doc/老師手冊.md`、`doc/學員手冊.md`、`config/version.json`
  - 產生：`messages/zh-CN.json`（`npm run gen:zh-cn`）
  - 不變：`app/[locale]/(user)/layout.tsx`、`components/notification/notification-drawer.tsx`、`components/ui/sheet.tsx`、各按鈕導向的路由頁、`components/layout/footer.tsx`
- **Database**：無 schema 變更。
- **既有資料**：不涉及。
- **UI / 行為**：手機版 Topbar 由「7 顆平鋪按鈕」改為「Logo ＋ 單一選單按鈕」，動作改於 Sheet 內點選；桌機版完全不變。無新頁面、無路由變更、無權限變更。
- **Route access**：不變（`(user)` group layout 既有守衛）。
- **Dependencies**：**無新增套件**——`sheet` / `dropdown-menu` 等 shadcn 元件與 `@tabler/icons-react` 皆已在專案內。

## Open Questions

- 無。範圍（僅 Topbar 手機收合選單 ＋ Logo 排版、不含 guest 登入頁）已由使用者確認；收合採 shadcn `Sheet`、斷點 `md`（768px）為預設決策。
