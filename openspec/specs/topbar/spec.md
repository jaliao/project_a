# topbar Specification

## Purpose
TBD - normalized for archive compatibility. Update Purpose for topbar.
## Requirements
### Requirement: Topbar 共用元件
`(user)` layout SHALL 在所有已登入頁面頂部渲染 Topbar 元件，包含：系統標題、右側操作按鈕群組。

Topbar 的 `<header>` 橫條（背景、底線、`sticky` 定位）SHALL 延伸整個視窗寬度；其**內容列**（品牌／Logo 與右側操作項目）SHALL 對齊 app 殼的最大寬度容器（1280px、水平置中，見 `app-shell`），使 Logo 靠內容框左緣、操作按鈕靠內容框右緣，與 `<main>` 內容左右對齊。內容列的水平內距 SHALL 與 `<main>` 的 gutter 一致（手機約 16px、`sm` 以上約 24px）。

#### Scenario: 已登入頁面顯示 Topbar
- **WHEN** 已登入使用者存取任何 `(user)` 路由下的頁面
- **THEN** 頁面頂部顯示 Topbar

#### Scenario: 寬螢幕 Topbar 內容對齊內容框
- **WHEN** 已登入使用者在寬度大於 1280px 的視窗檢視 Topbar
- **THEN** `<header>` 的背景與底線仍滿版，但 Logo 與操作按鈕對齊 1280px 置中容器的左右緣（與主內容區對齊）

### Requirement: 新增課程按鈕
Topbar SHALL 包含「新增課程」按鈕（圖示 + 文字），點擊後開啟課程訂購 Dialog。

#### Scenario: 點擊新增課程按鈕
- **WHEN** 使用者點擊「新增課程」按鈕
- **THEN** 系統開啟課程訂購表單 Dialog（CourseOrderDialog）

### Requirement: 個人資料按鈕
Topbar SHALL 包含「個人資料」圖示按鈕，點擊後導向 `/profile`。

#### Scenario: 點擊個人資料按鈕
- **WHEN** 使用者點擊個人資料按鈕
- **THEN** 系統導向 `/profile` 頁面

### Requirement: 訊息通知按鈕

Topbar SHALL 包含「社群」圖示按鈕（原顯示文字「訊息」，本次更名為「社群」並更換圖示為社群／群組樣式）。點擊 SHALL 導向 `/messages`（社群頁面）。若存在未讀對話，圖示 SHALL 顯示未讀角標（未讀數為 0 時不顯示）。顯示文字 SHALL 以 i18n key（`nav.community`）取用，SHALL NOT 於元件寫死中文。導向目的地、未讀角標資料來源（`unreadMessageCount`）與 `key` SHALL 不變。

#### Scenario: 無未讀訊息時
- **WHEN** 使用者載入任何頁面且未讀對話數為 0
- **THEN** 「社群」圖示不顯示數字 Badge

#### Scenario: 點擊社群按鈕
- **WHEN** 使用者點擊「社群」按鈕
- **THEN** 系統導向 `/messages`（社群頁面）

---

### Requirement: 媒合布告欄按鈕
Topbar 右上角按鈕群組 SHALL 包含「媒合布告欄」按鈕（圖示），所有登入會員皆可見，點擊後導向媒合布告欄 `/match-board`。

#### Scenario: 顯示媒合布告欄按鈕
- **WHEN** 任何登入會員檢視 Topbar
- **THEN** 右上角顯示「媒合布告欄」按鈕（不需特定身分）

#### Scenario: 點擊前往布告欄
- **WHEN** 會員點擊「媒合布告欄」按鈕
- **THEN** 導向 `/match-board`

### Requirement: 我需要幫助按鈕
Topbar 右側操作按鈕群組 SHALL 包含「聯絡管理者」圖示按鈕，位於「訊息通知」按鈕左邊，所有已登入會員皆可見，點擊後導向個人專區「我的提問」頁面（不彈出對話框）。

#### Scenario: 顯示聯絡管理者按鈕
- **WHEN** 任何已登入會員檢視 Topbar
- **THEN** 右側按鈕群組於「訊息通知」按鈕左邊顯示「聯絡管理者」圖示按鈕（不需特定身分）

#### Scenario: 點擊聯絡管理者按鈕
- **WHEN** 會員點擊「聯絡管理者」按鈕
- **THEN** 導向 `/user/{spiritId}/inquiries` 頁面（見 `contact-admin` capability）

### Requirement: Topbar 響應式收合（手機選單）

Topbar 的右側操作按鈕群組 SHALL 依視窗寬度以斷點（`md`，768px）切換呈現方式：

- **桌機（`>= md`）**：所有操作按鈕（回首頁、媒合布告欄、分段式查經、後台管理〔僅 `canAccessAdmin` 為真時〕、個人資料、聯絡管理者、社群、訊息通知）SHALL 以現行的水平圖示按鈕群平鋪呈現，外觀、順序與各按鈕行為不變（「社群」即原「訊息」項，僅顯示文字與圖示更換）。
- **手機（`< md`）**：上述按鈕 SHALL NOT 平鋪；Topbar 右側 SHALL 只顯示單一「選單」按鈕。點擊「選單」按鈕 SHALL 開啟一個側向滑出面板（採用專案既有的 shadcn `Sheet` 元件），面板內 SHALL 以垂直清單列出與桌機**相同集合**的操作項目，每一項 SHALL 同時呈現圖示與文字標籤且整列可點擊。

面板中的「社群」與「訊息通知」項目 SHALL 在文字右側顯示對應的未讀數量標記（未讀數為 0 時不顯示；超過 99 顯示 `99+`），數值來源與桌機一致（`unreadMessageCount` / `unreadCount`）。

面板中「後台管理」項目 SHALL 僅在 `canAccessAdmin(roles)` 為真時出現，與桌機的顯示條件一致。

點擊面板中任一「導頁」項目 SHALL 導向與桌機對應按鈕相同的目的地，並於導頁後關閉面板。點擊面板中的「訊息通知」項目 SHALL 關閉面板並開啟既有的通知 Drawer（`NotificationDrawer`），行為與桌機點擊「訊息通知」按鈕一致。

「選單」按鈕 SHALL 具備可辨識的無障礙名稱（`aria-label` / `title`），其文字 SHALL 以 i18n key（`nav.menu`）取用，SHALL NOT 於元件寫死中文。滑出面板 SHALL 具備標題（`SheetTitle`）。同一操作在任一斷點下 SHALL NOT 同時存在兩個可聚焦的觸發節點（桌機群與手機選單以 CSS 斷點互斥顯示）。

本需求 SHALL NOT 改變任何操作的目的地、顯示條件或權限判定；僅改變手機寬度下的排列與觸發方式，以及「社群」（原「訊息」）項的顯示文字與圖示。

#### Scenario: 手機寬度顯示單一選單按鈕

- **WHEN** 已登入使用者在視窗寬度小於 768px 檢視任一 `(user)` 頁面
- **THEN** Topbar 右側只顯示一顆「選單」圖示按鈕，原本平鋪的操作按鈕不顯示

#### Scenario: 開啟手機選單看到完整動作清單

- **WHEN** 使用者在手機寬度點擊「選單」按鈕
- **THEN** 側向滑出面板開啟，內含「回首頁 / 媒合布告欄 / 分段式查經 / 個人資料 / 聯絡管理者 / 社群 / 訊息通知」項目（每項含圖示與文字），且僅當使用者具後台權限時另含「後台管理」項目

#### Scenario: 手機選單導頁後關閉面板

- **WHEN** 使用者在開啟的手機選單中點擊「媒合布告欄」項目
- **THEN** 系統導向 `/match-board` 並關閉滑出面板

#### Scenario: 手機選單開啟通知 Drawer

- **WHEN** 使用者在開啟的手機選單中點擊「訊息通知」項目
- **THEN** 系統關閉滑出面板並開啟通知 Drawer（`NotificationDrawer`），不進行頁面導向

#### Scenario: 手機選單點擊社群項目導向社群頁

- **WHEN** 使用者在開啟的手機選單中點擊「社群」項目
- **THEN** 系統導向 `/messages`（社群頁面）並關閉滑出面板

#### Scenario: 手機選單顯示未讀數

- **WHEN** 使用者有 3 則未讀對話與 5 則未讀通知，於手機寬度開啟選單
- **THEN** 面板中「社群」項目右側顯示 `3`、「訊息通知」項目右側顯示 `5`；若某項未讀數為 0 則該項不顯示數量標記

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

### Requirement: Topbar 我的學習入口

Topbar 的操作項目集合 SHALL 包含「分段式查經」（原顯示文字「我的學習」），桌機（水平圖示按鈕列）與手機（收合選單）皆呈現，位置一致（於「媒合布告欄」之後）。點擊「分段式查經」SHALL 導向當前登入使用者的 `/user/{spiritId}/learning`。

此項目 SHALL 對所有已登入使用者顯示（與「個人資料」「聯絡管理者」相同，不需特定身分），其文字 SHALL 以 i18n key（`nav.learning`）取用，SHALL NOT 於元件寫死中文。手機選單中該項目 SHALL 同時呈現圖示與文字標籤，整列可點擊；點擊後 SHALL 於導頁後關閉選單面板。

#### Scenario: 桌機顯示分段式查經按鈕

- **WHEN** 已登入使用者在視窗寬度大於或等於 768px 檢視 Topbar
- **THEN** 水平按鈕列於「媒合布告欄」之後顯示「分段式查經」圖示按鈕，點擊導向 `/user/{spiritId}/learning`

#### Scenario: 手機選單包含分段式查經項目

- **WHEN** 已登入使用者在手機寬度開啟 Topbar「選單」
- **THEN** 選單清單於「媒合布告欄」之後含「分段式查經」項目（圖示＋文字），點擊導向 `/user/{spiritId}/learning` 並關閉選單面板

#### Scenario: 所有登入者皆可見

- **WHEN** 任一已登入使用者（不論身分）檢視 Topbar
- **THEN** 「分段式查經」入口存在（桌機按鈕列與手機選單）

