## ADDED Requirements

### Requirement: 已具完整基本資料者跳過 Step 2
若使用者登入時帳號已具備完整基本資料（`realName`、`phone`、`gender`、`birthYear`、`churchType` 皆已填妥，例如透過已要求完整基本資料的 `/register` 表單建立的帳號），Wizard SHALL 在 Step 1（設定密碼）完成後直接進入 Step 3（歡迎畫面），不再顯示 Step 2 的基本資料表單。

#### Scenario: 註冊時已填妥基本資料者，Step 1 完成後直接進入 Step 3
- **WHEN** 帳號的 `realName`／`phone`／`gender`／`birthYear`／`churchType` 皆已填妥的使用者於 Step 1 完成密碼變更
- **THEN** Wizard 直接切換至 Step 3，不顯示 Step 2 表單

#### Scenario: 基本資料不全者仍依序顯示 Step 2
- **WHEN** 帳號缺少 `realName`／`phone`／`gender`／`birthYear`／`churchType` 任一項的使用者於 Step 1 完成密碼變更
- **THEN** Wizard 依原行為切換至 Step 2，顯示基本資料表單
