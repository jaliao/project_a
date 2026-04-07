## ADDED Requirements

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
