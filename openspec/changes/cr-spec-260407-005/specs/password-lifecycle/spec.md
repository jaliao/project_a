## ADDED Requirements

### Requirement: 忘記密碼頁面樣式
`/forgot-password` 頁面 SHALL 採用與登入/註冊頁一致的兩欄品牌版型，並使用 shadcn/ui 元件。

#### Scenario: 桌面版顯示兩欄
- **WHEN** 使用者在桌面（lg 以上）開啟 `/forgot-password`
- **THEN** 左側顯示品牌區（深色背景 + 引言），右側顯示 Email 輸入表單

#### Scenario: 手機版顯示全版表單
- **WHEN** 使用者在手機開啟 `/forgot-password`
- **THEN** 顯示全版表單，頂部有 Logo 與「返回登入」連結

#### Scenario: 送出後顯示成功提示
- **WHEN** 使用者送出 Email 表單（無論 Email 是否存在）
- **THEN** 頁面切換為成功狀態，顯示「若此 Email 已註冊，將發送密碼重設信至您的信箱」

### Requirement: 重設密碼頁面樣式
`/reset-password` 頁面 SHALL 採用與登入/註冊頁一致的兩欄品牌版型，並使用 shadcn/ui 元件。

#### Scenario: 有效 token 顯示表單
- **WHEN** 使用者以有效 token 開啟 `/reset-password?token=xxx`
- **THEN** 顯示「新密碼」與「確認新密碼」輸入欄及送出按鈕

#### Scenario: 缺少 token 顯示錯誤
- **WHEN** 使用者開啟 `/reset-password`（無 token）
- **THEN** 顯示「無效的連結」提示，並提供「重新申請密碼重設」連結

### Requirement: 登入頁忘記密碼入口
登入表單 SHALL 在密碼欄旁顯示「忘記密碼？」連結，導向 `/forgot-password`。

#### Scenario: 顯示忘記密碼連結
- **WHEN** 使用者開啟登入頁
- **THEN** 密碼輸入欄的 label 列右側顯示「忘記密碼？」小字連結
