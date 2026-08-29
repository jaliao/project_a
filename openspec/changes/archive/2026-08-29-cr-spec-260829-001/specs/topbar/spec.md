# topbar Delta（cr-spec-260829-001）

## ADDED Requirements

### Requirement: Topbar 響應式收合（手機選單）

Topbar 的右側操作按鈕群組 SHALL 依視窗寬度以斷點（`md`，768px）切換呈現方式：

- **桌機（`>= md`）**：所有操作按鈕（回首頁、媒合布告欄、後台管理〔僅 `canAccessAdmin` 為真時〕、個人資料、聯絡管理者、訊息、訊息通知）SHALL 以現行的水平圖示按鈕群平鋪呈現，外觀、順序與各按鈕行為不變。
- **手機（`< md`）**：上述按鈕 SHALL NOT 平鋪；Topbar 右側 SHALL 只顯示單一「選單」按鈕。點擊「選單」按鈕 SHALL 開啟一個側向滑出面板（採用專案既有的 shadcn `Sheet` 元件），面板內 SHALL 以垂直清單列出與桌機**相同集合**的操作項目，每一項 SHALL 同時呈現圖示與文字標籤且整列可點擊。

面板中的「訊息」與「訊息通知」項目 SHALL 在文字右側顯示對應的未讀數量標記（未讀數為 0 時不顯示；超過 99 顯示 `99+`），數值來源與桌機一致（`unreadMessageCount` / `unreadCount`）。

面板中「後台管理」項目 SHALL 僅在 `canAccessAdmin(roles)` 為真時出現，與桌機的顯示條件一致。

點擊面板中任一「導頁」項目 SHALL 導向與桌機對應按鈕相同的目的地，並於導頁後關閉面板。點擊面板中的「訊息通知」項目 SHALL 關閉面板並開啟既有的通知 Drawer（`NotificationDrawer`），行為與桌機點擊「訊息通知」按鈕一致。

「選單」按鈕 SHALL 具備可辨識的無障礙名稱（`aria-label` / `title`），其文字 SHALL 以 i18n key（`nav.menu`）取用，SHALL NOT 於元件寫死中文。滑出面板 SHALL 具備標題（`SheetTitle`）。同一操作在任一斷點下 SHALL NOT 同時存在兩個可聚焦的觸發節點（桌機群與手機選單以 CSS 斷點互斥顯示）。

本需求 SHALL NOT 改變任何操作的目的地、顯示條件或權限判定；僅改變手機寬度下的排列與觸發方式。

#### Scenario: 手機寬度顯示單一選單按鈕

- **WHEN** 已登入使用者在視窗寬度小於 768px 檢視任一 `(user)` 頁面
- **THEN** Topbar 右側只顯示一顆「選單」圖示按鈕，原本平鋪的操作按鈕不顯示

#### Scenario: 開啟手機選單看到完整動作清單

- **WHEN** 使用者在手機寬度點擊「選單」按鈕
- **THEN** 側向滑出面板開啟，內含「回首頁 / 媒合布告欄 / 個人資料 / 聯絡管理者 / 訊息 / 訊息通知」項目（每項含圖示與文字），且僅當使用者具後台權限時另含「後台管理」項目

#### Scenario: 手機選單導頁後關閉面板

- **WHEN** 使用者在開啟的手機選單中點擊「媒合布告欄」項目
- **THEN** 系統導向 `/match-board` 並關閉滑出面板

#### Scenario: 手機選單開啟通知 Drawer

- **WHEN** 使用者在開啟的手機選單中點擊「訊息通知」項目
- **THEN** 系統關閉滑出面板並開啟通知 Drawer（`NotificationDrawer`），不進行頁面導向

#### Scenario: 手機選單顯示未讀數

- **WHEN** 使用者有 3 則未讀訊息與 5 則未讀通知，於手機寬度開啟選單
- **THEN** 面板中「訊息」項目右側顯示 `3`、「訊息通知」項目右側顯示 `5`；若某項未讀數為 0 則該項不顯示數量標記

#### Scenario: 桌機寬度維持平鋪

- **WHEN** 已登入使用者在視窗寬度大於或等於 768px 檢視任一 `(user)` 頁面
- **THEN** Topbar 右側維持現行的水平圖示按鈕群平鋪，且不顯示「選單」按鈕

### Requirement: Topbar 品牌 / Logo 區排版

Topbar 左側 SHALL 顯示品牌 / Logo 區，包含一個圖示標記與系統名稱（`common.appName`）文字。品牌區 SHALL 可點擊，點擊後導向使用者首頁（有 `spiritId` 時為 `/user/{spiritId}`，否則 `/`），並具備可辨識的無障礙名稱。

品牌區 SHALL 在任何視窗寬度下維持單行、不換行、不破版：當可用寬度不足時，系統名稱文字 SHALL 以截斷（truncate / ellipsis）處理，SHALL NOT 擠壓或推擠右側操作區、SHALL NOT 造成右側按鈕或其未讀數角標溢出或被裁切。

Logo 圖示標記 SHALL 使用與登入頁一致的視覺（隨主題色的 inline SVG），並以 `aria-hidden` 標示（可及名稱由品牌區的 `aria-label` 提供）。

#### Scenario: 窄螢幕品牌區截斷不破版

- **WHEN** 使用者在 360px 寬的手機檢視 Topbar
- **THEN** 品牌區維持單行、系統名稱過長時以省略號截斷，右側的「選單」按鈕完整顯示且未被裁切

#### Scenario: 點擊品牌區回首頁

- **WHEN** 使用者點擊 Topbar 左側的 Logo / 系統名稱
- **THEN** 系統導向使用者首頁（`/user/{spiritId}` 或 `/`）
