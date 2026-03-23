## ADDED Requirements

### Requirement: User 模型支援暱稱欄位
系統 SHALL 在 User 資料模型中提供 `nickname`（`String?`）欄位，供使用者填寫自訂暱稱。

#### Scenario: 暱稱欄位可為空
- **WHEN** 使用者未填寫暱稱
- **THEN** 系統接受 nickname 為 null，不強制要求填寫

#### Scenario: 暱稱長度限制
- **WHEN** 使用者輸入超過 20 個字元的暱稱
- **THEN** 系統拒絕儲存並回傳驗證錯誤

### Requirement: Profile 表單支援暱稱欄位編輯
Profile 頁面的基本資料表單 SHALL 提供暱稱（nickname）輸入欄位，讓使用者填寫或修改暱稱。

#### Scenario: 暱稱顯示現有值
- **WHEN** 使用者開啟 Profile 頁面
- **THEN** 暱稱輸入欄位顯示目前儲存的 nickname 值（若無則為空）

#### Scenario: 儲存暱稱成功
- **WHEN** 使用者在基本資料表單填入暱稱並點擊「儲存資料」
- **THEN** 系統將 nickname 更新至資料庫，並顯示成功 toast

### Requirement: Profile 頁面提供登出功能
Profile 頁面 SHALL 提供登出按鈕，讓使用者可直接在個人資料頁登出系統。

#### Scenario: 點擊登出按鈕
- **WHEN** 使用者在 Profile 頁面點擊「登出」按鈕
- **THEN** 系統呼叫 NextAuth signOut，將使用者導向 `/login` 頁面

#### Scenario: 登出按鈕視覺獨立
- **WHEN** 使用者瀏覽 Profile 頁面
- **THEN** 登出按鈕位於獨立的危險操作區塊（有視覺區隔），避免誤觸
