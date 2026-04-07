## ADDED Requirements

### Requirement: 首次登入強制變更密碼
系統 SHALL 偵測使用者以臨時密碼登入，並強制於完成密碼變更前阻擋所有其他操作。

#### Scenario: 使用臨時密碼登入後被攔截
- **WHEN** 使用者以臨時密碼成功登入，且 `isTempPassword = true`
- **THEN** 系統強制導向 `/change-password` 頁面，所有其他路由均回傳重新導向

#### Scenario: 臨時密碼變更成功
- **WHEN** 使用者於 `/change-password` 頁面輸入符合規則的新密碼並確認
- **THEN** 系統更新密碼 hash，將 `isTempPassword` 設為 `false`，並導向 Profile 或首頁

#### Scenario: 新密碼與臨時密碼相同
- **WHEN** 使用者輸入的新密碼與目前臨時密碼相同
- **THEN** 系統拒絕並回傳錯誤「新密碼不可與臨時密碼相同」

#### Scenario: 已變更密碼的用戶不被攔截
- **WHEN** `isTempPassword = false` 的使用者正常登入
- **THEN** 系統正常放行，不強制導向變更密碼頁面

### Requirement: 密碼格式規則
使用者設定的新密碼 SHALL 符合最低強度要求。

#### Scenario: 密碼長度不足
- **WHEN** 使用者提交長度少於 8 字元的密碼
- **THEN** 系統回傳驗證錯誤「密碼至少需 8 字元」

### Requirement: 忘記密碼流程
系統 SHALL 提供密碼重設機制，使用者輸入 Email 後取得含加密 token 的重設連結。

#### Scenario: 輸入已存在 Email 申請重設
- **WHEN** 使用者於 `/forgot-password` 頁面輸入已存在帳號的 Email 並送出
- **THEN** 系統生成一次性 token（TTL 1 小時），發送密碼重設連結至該 Email

#### Scenario: 輸入不存在 Email
- **WHEN** 使用者輸入系統中不存在的 Email
- **THEN** 系統回傳相同提示（「若此 Email 已註冊，將發送重設信」），不洩漏帳號存在與否

#### Scenario: 點擊有效重設連結
- **WHEN** 使用者點擊有效且未過期的重設連結
- **THEN** 系統驗證 token，允許使用者設定新密碼，設定成功後 token 立即失效

#### Scenario: 點擊過期或已使用連結
- **WHEN** 使用者點擊已過期（超過 1 小時）或已使用的重設連結
- **THEN** 系統回傳錯誤「連結已失效，請重新申請」

### Requirement: 首次登入設定密碼頁面樣式
`/change-password` 頁面 SHALL 採用與登入/註冊頁一致的兩欄品牌版型，並使用 shadcn/ui 元件與眼睛 icon 明碼切換。

#### Scenario: 桌面版兩欄顯示
- **WHEN** 使用者被導向 `/change-password`（桌面，lg 以上）
- **THEN** 左側顯示品牌區，右側顯示三欄密碼表單（目前密碼、新密碼、確認新密碼），標題為「第一次登入？請設定您的密碼」

#### Scenario: 三個密碼欄皆可切換明碼
- **WHEN** 使用者點擊任一密碼欄右側眼睛 icon
- **THEN** 該欄切換為明碼顯示，再次點擊恢復密碼顯示

### Requirement: 會員在 Profile 頁變更密碼
已登入的 Email 帳號會員 SHALL 能在個人資料頁面（`/user/[spiritId]/profile`）變更密碼，不需離開頁面。

#### Scenario: 顯示變更密碼 Card
- **WHEN** Email 帳號會員（`passwordHash` 不為 null）開啟 Profile 頁面
- **THEN** 頁面底部顯示「變更密碼」Card，含目前密碼、新密碼、確認新密碼欄位

#### Scenario: Google OAuth 帳號不顯示
- **WHEN** 純 Google OAuth 帳號（無 `passwordHash`）開啟 Profile 頁面
- **THEN** 不顯示「變更密碼」Card

#### Scenario: 變更密碼成功
- **WHEN** 會員輸入正確目前密碼及符合規則的新密碼後送出
- **THEN** 系統更新密碼，顯示成功 toast，表單清空

#### Scenario: 目前密碼錯誤
- **WHEN** 會員輸入的目前密碼不正確
- **THEN** 系統回傳「目前密碼不正確」錯誤，不更新密碼

#### Scenario: 密碼欄眼睛 icon 切換
- **WHEN** 會員點擊密碼欄右側眼睛 icon
- **THEN** 該欄切換明碼/密碼顯示

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
