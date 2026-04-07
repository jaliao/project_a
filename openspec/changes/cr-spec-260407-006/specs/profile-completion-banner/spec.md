## MODIFIED Requirements

### Requirement: Dashboard 顯示資料完整度提醒 Banner
當登入使用者的 realName、commEmail、phone 任一欄位為空白或 null 時，且 `REQUIRE_PROFILE_COMPLETION` 為 `false`，Dashboard 首頁 SHALL 在統計卡片上方顯示提醒 Banner，引導使用者前往填寫個人資料。

#### Scenario: 強制轉導停用時資料未完整顯示提醒 Banner
- **WHEN** `REQUIRE_PROFILE_COMPLETION=false`，且使用者的 realName、commEmail、phone 任一欄位為空
- **THEN** 頁面頂部顯示提醒 Banner，內含文字說明與連結至 Profile 的按鈕

#### Scenario: 強制轉導啟用時不顯示 Banner（由轉導機制處理）
- **WHEN** `REQUIRE_PROFILE_COMPLETION=true`（或未設定），且使用者資料未完整
- **THEN** Dashboard 不顯示提醒 Banner（使用者已被 layout 轉導至 Profile 頁）

#### Scenario: 三個欄位皆空時仍顯示 Banner
- **WHEN** `REQUIRE_PROFILE_COMPLETION=false`，且使用者的 realName、commEmail、phone 全部未填寫
- **THEN** 系統仍顯示同一個提醒 Banner（不顯示多個 Banner）
