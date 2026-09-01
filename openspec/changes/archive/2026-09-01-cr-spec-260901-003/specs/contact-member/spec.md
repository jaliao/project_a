# contact-member Delta（cr-spec-260901-003）

## RENAMED Requirements

- FROM: `### Requirement: Topbar 訊息入口`
- TO: `### Requirement: Topbar 社群入口`

- FROM: `### Requirement: 訊息頁面獨立呈現與文字可選取複製`
- TO: `### Requirement: 社群頁面獨立呈現與文字可選取複製`

## MODIFIED Requirements

### Requirement: Topbar 社群入口

Topbar SHALL 對所有登入會員提供「社群」圖示按鈕（原顯示文字「訊息」、原圖示為訊息圖示；本次更名為「社群」並更換為社群／群組樣式圖示），點擊後導覽至社群頁面（路由 `/messages` 不變）；若目前有未讀對話，圖示 SHALL 顯示未讀角標。顯示文字 SHALL 以 i18n key（`nav.community`）取用，SHALL NOT 於元件寫死中文。

#### Scenario: 點擊社群按鈕導覽至社群頁面
- **WHEN** 已登入會員點擊 Topbar「社群」按鈕
- **THEN** 導覽至 `/messages`，顯示社群頁面（預設「好友」頁籤）

#### Scenario: 有未讀對話時顯示角標
- **WHEN** 已登入會員存在至少一個未讀對話
- **THEN** Topbar「社群」圖示顯示未讀角標（數字或紅點）

#### Scenario: 無未讀對話時不顯示角標
- **WHEN** 已登入會員所有對話皆已讀
- **THEN** Topbar「社群」圖示不顯示未讀角標

---

### Requirement: 社群頁面獨立呈現與文字可選取複製

系統 SHALL 以獨立頁面（`/messages`，非 Drawer／Modal 等覆蓋型元件）呈現社群功能，確保頁面內容不受任何覆蓋型元件的文字選取限制影響。

社群頁面 SHALL 於頁首顯示標題「社群」與「加好友」按鈕（點擊開啟加好友 Drawer，見 `community-friends`）；頁面內容 SHALL 分為「好友」與「訊息」兩個頁籤：

- **「訊息」頁籤**：沿用既有對話功能——頻道列表（釘選優先、未讀提示、群組圖示、自訂標題）與選中對話的完整訊息記錄；窄螢幕（手機寬度）下頻道列表與訊息記錄 SHALL 可切換顯示（同一時間僅顯示一者），並提供「返回頻道列表」的操作。桌面瀏覽器中訊息文字 SHALL 可正常以滑鼠選取並複製。
- **「好友」頁籤**：顯示目前使用者的好友清單（見 `community-friends`）。

頁籤選擇 SHALL 以查詢參數 `?tab=friends|messages` 記錄；未帶 `?tab=` 時預設「好友」頁籤；**帶 `?with={targetUserId}` 時 SHALL 強制顯示「訊息」頁籤**並沿用既有「與目標對象已有對話則顯示選擇畫面、否則直接進入新對話畫面」的行為。

#### Scenario: 社群頁頁首顯示標題與加好友按鈕
- **WHEN** 已登入會員開啟 `/messages`
- **THEN** 頁首顯示「社群」標題與「加好友」按鈕，內容區顯示「好友 | 訊息」兩頁籤

#### Scenario: 預設顯示好友頁籤
- **WHEN** 會員開啟 `/messages`（未帶 `?tab=` 與 `?with=`）
- **THEN** 預設顯示「好友」頁籤

#### Scenario: 帶 with 參數強制訊息頁籤
- **WHEN** 會員經「傳訊息」入口開啟 `/messages?with={targetUserId}`
- **THEN** 頁面顯示「訊息」頁籤，並依與該對象是否已有對話顯示選擇畫面或新對話畫面

#### Scenario: 訊息頁籤桌面可選取複製訊息文字
- **WHEN** 使用者於桌面瀏覽器在「訊息」頁籤以滑鼠拖曳選取訊息記錄中的文字
- **THEN** 文字可被正常選取，複製後貼上內容與原文字一致

#### Scenario: 訊息頁籤窄螢幕可返回頻道列表
- **WHEN** 使用者於窄螢幕在「訊息」頁籤檢視某對話的訊息記錄
- **THEN** 頁面提供返回頻道列表的操作，點擊後顯示頻道列表
