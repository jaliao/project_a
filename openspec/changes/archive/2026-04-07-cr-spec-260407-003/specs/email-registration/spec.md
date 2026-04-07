## MODIFIED Requirements

### Requirement: Email 註冊成功回饋
Email 註冊成功後，系統 SHALL 以 Dialog 告知使用者帳號已建立，並提供「返回首頁」按鈕導向 `/`。

#### Scenario: 註冊成功顯示 Dialog
- **WHEN** 使用者送出有效 Email 且 `registerWithEmail` 回傳 `success: true`
- **THEN** 系統開啟 Dialog，顯示成功訊息，不再顯示 toast

#### Scenario: 點擊返回首頁
- **WHEN** 使用者在成功 Dialog 中點擊「返回首頁」
- **THEN** 系統導向 `/`

#### Scenario: Dialog 無法直接關閉
- **WHEN** 使用者嘗試點擊 Dialog 背景或按 Esc
- **THEN** Dialog 維持開啟（使用者必須點擊「返回首頁」才能離開）
