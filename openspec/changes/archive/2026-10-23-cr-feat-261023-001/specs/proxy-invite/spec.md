## MODIFIED Requirements

### Requirement: 邀請 Token 核發

系統 SHALL 以 `ProxyInviteToken` model（`token`／`userId`／`email` 快照／`expiresAt`／`usedAt`／`voidedAt`／`createdAt`）記錄代填學員的邀請信核發紀錄。核發時機為：建立代填學員時填寫了 email、或在該學員的會員首頁編輯／補發邀請時。Token 有效期 SHALL 為核發起 30 天，一次性使用（使用後 `usedAt` 標記，不可重複使用）。Token 之有效性判定 SHALL 同時檢查 `usedAt IS NULL` 與 `voidedAt IS NULL`（`voidedAt` 為補發邀請作廢時寫入，與受邀者實際完成註冊的 `usedAt` 為獨立欄位，見「編輯邀請 Email 與補發邀請」）。

#### Scenario: 建立代填學員時填寫 email 立即核發
- **WHEN** 老師／管理者建立代填學員並填寫 email
- **THEN** 系統核發一筆新的 `ProxyInviteToken`（`expiresAt` 為 30 天後），並將該 email 寫回該筆 `User`

#### Scenario: Token 一次性使用
- **WHEN** 受邀者已透過某筆 `ProxyInviteToken` 完成註冊（`usedAt` 已標記）
- **THEN** 該 token 之後再被開啟時，系統視為無效連結，不可重複完成註冊

#### Scenario: Token 過期
- **WHEN** 受邀者開啟的連結所帶 token 的 `expiresAt` 已早於目前時間
- **THEN** 系統顯示「邀請連結已失效，請聯繫啟動事工同工或是授課老師重新發送邀請」，不允許設定密碼

#### Scenario: Token 已被作廢
- **WHEN** 受邀者開啟的連結所帶 token 的 `voidedAt` 已被標記（因後續補發邀請而作廢）
- **THEN** 系統視為無效連結，顯示「邀請連結已失效，請聯繫啟動事工同工或是授課老師重新發送邀請」，不允許設定密碼

### Requirement: 完成註冊頁

系統 SHALL 提供 `/complete-registration?token=xxx` 頁面（免登入，版型比照 `/reset-password`）。頁面驗證 token 有效（未過期、未使用、未作廢）且對應 `User.isProxyMember === true` 後，SHALL 讓使用者設定密碼；送出後系統 SHALL 於單一資料庫交易內：將該密碼雜湊寫入該筆既有 `User.passwordHash`、將 `User.isProxyMember` 設為 `false`、將 token 標記 `usedAt`。此流程 SHALL NOT 建立任何新的 `User` 記錄，原有的課程報名、結業紀錄等關聯資料 SHALL 原封不動（因為資料從未分裂成兩筆）。

#### Scenario: 完成註冊成功
- **WHEN** 受邀者以有效且未使用、未作廢的 token 開啟完成註冊頁並設定符合規則的新密碼送出
- **THEN** 系統在同一筆 `User` 上寫入密碼雜湊、`isProxyMember` 轉為 `false`、token 標記 `usedAt`，原課程報名與結業紀錄不變，並導向登入頁提示「註冊完成，請使用新密碼登入」

#### Scenario: 已非代填狀態的帳號視為連結失效
- **WHEN** token 本身有效，但對應的 `User.isProxyMember` 已為 `false`（已透過其他管道完成註冊）
- **THEN** 系統顯示連結已失效，不重複處理

#### Scenario: 密碼格式不符
- **WHEN** 受邀者輸入少於 8 字元的密碼
- **THEN** 系統回傳驗證錯誤「密碼至少需 8 字元」，不寫入任何變更

#### Scenario: 過期或已使用或已作廢的連結顯示明確錯誤
- **WHEN** 使用者開啟已過期、已使用或已作廢的完成註冊連結
- **THEN** 頁面顯示「邀請連結已失效，請聯繫啟動事工同工或是授課老師重新發送邀請」，不顯示密碼設定表單

## ADDED Requirements

### Requirement: 編輯邀請 Email 與補發邀請

系統 SHALL 提供「編輯邀請 Email」與「補發邀請」操作，可由**管理者**或**該代填學員所屬班級的授課老師**執行：後者定義為該代填學員名下存在至少一筆 `InviteEnrollment`（不限 `status`），其所屬 `CourseInvite.createdById` 為操作者本人。不具備這兩種身分之一者 SHALL 無法執行此操作，Server Action SHALL 拒絕並回傳無權限訊息。

執行「補發邀請」時，系統 SHALL 先將該使用者名下所有尚未使用且尚未作廢的 `ProxyInviteToken`（`usedAt IS NULL AND voidedAt IS NULL`）標記 `voidedAt` 為目前時間（作廢，不寫入 `usedAt`），再核發一筆新 token 並重新寄信。「編輯邀請 Email」時，SHALL 先完成唯一性檢查與 `User.email` 更新，再依上述規則作廢舊 token 並核發新 token。`usedAt` SHALL 僅在受邀者實際完成註冊時寫入（見「完成註冊頁」），不因補發作廢而寫入。

#### Scenario: 管理者可操作任一代填學員
- **WHEN** 管理者對任一 `isProxyMember = true` 的會員執行編輯邀請 Email 或補發邀請
- **THEN** 系統允許執行，不檢查該管理者是否為其班級老師

#### Scenario: 該班授課老師可操作
- **WHEN** 某老師對一位曾被自己建立的某堂課（`CourseInvite.createdById` 為該老師）加入過的代填學員執行編輯邀請 Email 或補發邀請
- **THEN** 系統允許執行

#### Scenario: 無關老師不可操作
- **WHEN** 某老師對一位從未出現在自己任何課程名冊中的代填學員嘗試執行編輯邀請 Email 或補發邀請
- **THEN** 系統拒絕並回傳無權限訊息，不執行任何資料異動

#### Scenario: 補發邀請作廢舊連結
- **WHEN** 授權使用者對已核發過邀請的代填學員點擊「補發邀請」
- **THEN** 該使用者先前所有未使用且未作廢的 token 被標記 `voidedAt`，系統核發一筆新 token 並重新寄信

#### Scenario: 編輯時修改邀請 Email 且新 Email 已被使用
- **WHEN** 授權使用者在編輯邀請 Email 時將 email 改為已被其他帳號使用的值
- **THEN** 系統拒絕並回傳「此 Email 已被使用」，不作廢舊 token、不核發新 token、不變更 `User.email`

#### Scenario: 作廢不等同使用
- **WHEN** 某筆 `ProxyInviteToken` 因補發邀請被標記 `voidedAt`
- **THEN** 該筆紀錄的 `usedAt` SHALL 維持 null，不被視為「已完成註冊」

## REMOVED Requirements

### Requirement: 補發邀請使舊 Token 全部失效

**Reason**: 內容併入並改寫為「編輯邀請 Email 與補發邀請」Requirement——原文字綁定「會員詳情頁（admin-only）」的 UI 位置與權限敘述，現已改為操作入口移至會員首頁、授權範圍放寬為管理者或該會員所屬班級的授課老師，故以新 Requirement 完整取代，避免兩份描述同一行為但權限敘述互相矛盾。
**Migration**: 無資料遷移需求，純規格文字整併。
