## ADDED Requirements

### Requirement: Email 自主註冊
系統 SHALL 提供 Email 自主註冊路徑，使用者輸入 Email 即可建立帳號，無需預先存在於白名單中。

#### Scenario: 成功以未使用 Email 註冊
- **WHEN** 使用者輸入一個系統中尚未存在的 Email 並送出註冊表單
- **THEN** 系統建立帳號、核發 Spirit ID，並發送包含臨時密碼的通知信

#### Scenario: 使用已存在 Email 註冊
- **WHEN** 使用者輸入一個系統中已存在的 Email 並送出
- **THEN** 系統回傳錯誤提示「此 Email 已被使用」，不建立新帳號

### Requirement: 臨時密碼核發
系統 SHALL 於 Email 註冊成功後，自動生成一組隨機臨時密碼並以 Email 寄送給使用者。

#### Scenario: 臨時密碼格式
- **WHEN** 系統生成臨時密碼
- **THEN** 密碼 SHALL 包含大小寫英文字母與數字，長度不少於 12 字元（`[A-Za-z0-9]{12+}`）

#### Scenario: 通知信寄送
- **WHEN** 帳號建立成功
- **THEN** 系統發送通知信至註冊 Email，信中包含使用者的 Spirit ID 及臨時密碼

#### Scenario: 寄信失敗處理
- **WHEN** 通知信寄送失敗（SMTP 錯誤）
- **THEN** 帳號仍保持建立狀態，系統記錄錯誤；使用者可於登入後要求重發

### Requirement: Google OAuth 首次登入自動建帳
系統 SHALL 在 Google OAuth 使用者首次登入時自動建立帳號並核發 Spirit ID。

#### Scenario: Google 新用戶首次登入
- **WHEN** 使用者以 Google 帳號首次進行 OAuth 登入
- **THEN** 系統自動建立帳號、核發 Spirit ID，並導向 Profile 頁面完成資料補填

#### Scenario: Google 既有用戶再次登入
- **WHEN** 已建立帳號的使用者再次以 Google 登入
- **THEN** 系統正常登入，不重複建立帳號
