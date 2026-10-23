## ADDED Requirements

### Requirement: 邀請 Token 核發

系統 SHALL 以 `ProxyInviteToken` model（`token`／`userId`／`email` 快照／`expiresAt`／`usedAt`／`createdAt`）記錄代填學員的邀請信核發紀錄。核發時機為：建立代填學員時填寫了 email、或在會員詳情頁編輯／補發邀請時。Token 有效期 SHALL 為核發起 30 天，一次性使用（使用後 `usedAt` 標記，不可重複使用）。

#### Scenario: 建立代填學員時填寫 email 立即核發
- **WHEN** 老師／管理者建立代填學員並填寫 email
- **THEN** 系統核發一筆新的 `ProxyInviteToken`（`expiresAt` 為 30 天後），並將該 email 寫回該筆 `User`

#### Scenario: Token 一次性使用
- **WHEN** 受邀者已透過某筆 `ProxyInviteToken` 完成註冊（`usedAt` 已標記）
- **THEN** 該 token 之後再被開啟時，系統視為無效連結，不可重複完成註冊

#### Scenario: Token 過期
- **WHEN** 受邀者開啟的連結所帶 token 的 `expiresAt` 已早於目前時間
- **THEN** 系統顯示「邀請連結已失效，請聯繫老師重新發送邀請」，不允許設定密碼

### Requirement: 邀請信寄送

系統 SHALL 在核發 `ProxyInviteToken` 後寄送邀請信至核發當下傳入的 email，信件內容 SHALL 包含帶 token 的「完成註冊」連結。此寄信流程 SHALL NOT 套用 `resolveContactEmail()` 規則（代填學員 `commEmail` 恆為 `null`，直接以核發時的 email 為收件地址）。

#### Scenario: 寄出邀請信
- **WHEN** 系統核發一筆新的 `ProxyInviteToken`
- **THEN** 系統寄送含完成註冊連結的邀請信至該 token 核發時的 email

#### Scenario: 寄信失敗不中斷主流程
- **WHEN** 邀請信寄送發生例外（如 SMTP 逾時）
- **THEN** 系統記錄錯誤但不回滾已核發的 token 與已寫入的 email，與既有密碼重設寄信失敗處理方式一致

### Requirement: 補發邀請使舊 Token 全部失效

會員詳情頁 SHALL 提供「補發邀請」操作（admin-only）。執行時系統 SHALL 先將該使用者名下所有尚未使用的 `ProxyInviteToken` 標記為已使用（作廢），再核發一筆新 token 並重新寄信；若同時修改了邀請 email，SHALL 先完成唯一性檢查與 `User.email` 更新，再核發新 token。

#### Scenario: 補發邀請作廢舊連結
- **WHEN** 管理者對已核發過邀請的代填學員點擊「補發邀請」
- **THEN** 該使用者先前所有未使用的 token 被標記為已使用，系統核發一筆新 token 並重新寄信

#### Scenario: 補發時修改邀請 Email 且新 Email 已被使用
- **WHEN** 管理者在補發邀請的同時將 email 改為已被其他帳號使用的值
- **THEN** 系統拒絕並回傳「此 Email 已被使用」，不作廢舊 token、不核發新 token

### Requirement: 完成註冊頁

系統 SHALL 提供 `/complete-registration?token=xxx` 頁面（免登入，版型比照 `/reset-password`）。頁面驗證 token 有效（未過期、未使用）且對應 `User.isProxyMember === true` 後，SHALL 讓使用者設定密碼；送出後系統 SHALL 於單一資料庫交易內：將該密碼雜湊寫入該筆既有 `User.passwordHash`、將 `User.isProxyMember` 設為 `false`、將 token 標記 `usedAt`。此流程 SHALL NOT 建立任何新的 `User` 記錄，原有的課程報名、結業紀錄等關聯資料 SHALL 原封不動（因為資料從未分裂成兩筆）。

#### Scenario: 完成註冊成功
- **WHEN** 受邀者以有效且未使用的 token 開啟完成註冊頁並設定符合規則的新密碼送出
- **THEN** 系統在同一筆 `User` 上寫入密碼雜湊、`isProxyMember` 轉為 `false`、token 標記已使用，原課程報名與結業紀錄不變，並導向登入頁提示「註冊完成，請使用新密碼登入」

#### Scenario: 已非代填狀態的帳號視為連結失效
- **WHEN** token 本身有效，但對應的 `User.isProxyMember` 已為 `false`（已透過其他管道完成註冊）
- **THEN** 系統顯示連結已失效，不重複處理

#### Scenario: 密碼格式不符
- **WHEN** 受邀者輸入少於 8 字元的密碼
- **THEN** 系統回傳驗證錯誤「密碼至少需 8 字元」，不寫入任何變更

#### Scenario: 過期或已使用的連結顯示明確錯誤
- **WHEN** 使用者開啟已過期或已使用的完成註冊連結
- **THEN** 頁面顯示「邀請連結已失效，請聯繫老師重新發送邀請」，不顯示密碼設定表單

### Requirement: Google OAuth 以受邀 Email 登入自動連結

系統的 jwt callback 於 Google OAuth 分支 SHALL 偵測登入對應的 `User.isProxyMember` 為真時，將其更新為 `false`。因既有 `allowDangerousEmailAccountLinking: true` 設定，當受邀者以與代填帳號相同 email 的 Google 帳號登入時，NextAuth 會自動將此次登入關聯至既有 `User`（不建立新帳號），此規則確保關聯後該帳號不再被視為代填狀態。

#### Scenario: 以受邀 Email 之 Google 帳號登入自動連結並解除代填狀態
- **WHEN** 代填學員已被核發邀請（`User.email` 已寫入其 Google 帳號 email），其以該 Google 帳號完成 OAuth 登入
- **THEN** NextAuth 自動關聯至既有 `User`（不建立新帳號），且該 `User.isProxyMember` 由 jwt callback 更新為 `false`

#### Scenario: 一般既有會員的 Google 登入不受影響
- **WHEN** 一般（非代填）會員以 Google 帳號登入
- **THEN** jwt callback 不執行代填狀態更新（因 `isProxyMember` 本為 `false`），其餘既有行為不變

### Requirement: 自助註冊與 LINE 登入不作為認領管道

自助註冊頁（`registerWithEmail`）SHALL 維持既有「Email 已被使用即拒絕」行為，不因代填學員已被邀請而放寬；LINE 登入 SHALL 維持既有不自動連結既有帳號的設計。兩者皆不作為認領代填帳號的管道，僅邀請信 token 或 Google OAuth（皆為已驗證 email 所有權的管道）可自動連結。

#### Scenario: 自助註冊頁用已被邀請的 Email 註冊仍被拒絕
- **WHEN** 任何人嘗試在自助註冊頁以某代填學員已被邀請的 email 註冊新帳號
- **THEN** 系統拒絕並回傳「此 Email 已被使用」，不建立新帳號、不關聯至該代填帳號

#### Scenario: LINE 登入不自動連結代填帳號
- **WHEN** 代填學員本人以 LINE 帳號登入系統
- **THEN** 系統依既有 LINE 登入邏輯處理（不比對 email 自動連結），若需連結為同一帳號仍須透過既有人工合併精靈
