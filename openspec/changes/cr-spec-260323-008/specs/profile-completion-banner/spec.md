## ADDED Requirements

### Requirement: Dashboard 顯示資料完整度提醒 Banner
當登入使用者的 realName、commEmail、phone 任一欄位為空白或 null 時，Dashboard 首頁 SHALL 在統計卡片上方顯示提醒 Banner，引導使用者前往填寫個人資料。

#### Scenario: 資料未完整時顯示提醒 Banner
- **WHEN** 使用者登入後進入 Dashboard，且 realName、commEmail、phone 任一欄位為空
- **THEN** 頁面頂部顯示提醒 Banner，內含文字說明（如「請完善您的個人資料」）與連結至 `/profile` 的按鈕

#### Scenario: 三個欄位皆空時仍顯示 Banner
- **WHEN** 使用者的 realName、commEmail、phone 全部未填寫
- **THEN** 系統仍顯示同一個提醒 Banner（不顯示多個 Banner）

### Requirement: Dashboard 顯示歡迎訊息
當登入使用者的 realName、commEmail、phone 三個欄位皆已填寫時，Dashboard 首頁 SHALL 在統計卡片上方顯示個人化歡迎訊息。

#### Scenario: 資料完整時顯示歡迎訊息
- **WHEN** 使用者登入後進入 Dashboard，且 realName、commEmail、phone 均已填寫
- **THEN** 頁面顯示「歡迎回來，{displayName}！」，其中 displayName 優先使用 realName，若空則 fallback 至 name，再空則顯示「歡迎回來！」

#### Scenario: realName 為空但 name 存在時使用 name
- **WHEN** 使用者的 realName 為空，但 User.name 有值，且資料完整
- **THEN** 歡迎訊息使用 User.name 作為顯示名稱

### Requirement: Banner 與歡迎訊息互斥
Dashboard 首頁 SHALL 不同時顯示提醒 Banner 與歡迎訊息。

#### Scenario: 資料完整時不顯示 Banner
- **WHEN** 使用者資料完整（realName、commEmail、phone 均已填寫）
- **THEN** 頁面不顯示提醒 Banner

#### Scenario: 資料未完整時不顯示歡迎訊息
- **WHEN** 使用者資料不完整
- **THEN** 頁面不顯示歡迎訊息
