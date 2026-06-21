# seed-test-accounts Specification

## Purpose
TBD - normalized for archive compatibility. Update Purpose for seed-test-accounts.

## Requirements

### Requirement: Seed 腳本建立學員測試帳號
`make prisma-seed` 執行後，系統 SHALL 在資料庫中存在 4 位學員測試帳號，資料完整且密碼可用於登入，且帳號狀態為「已完成第一次登入補填」（`isTempPassword=false` 且 `realName`、`phone` 均已填寫），使測試者重置資料庫後可直接登入，無需手動走 onboarding 補填流程。

#### Scenario: 首次執行 seed
- **WHEN** 資料庫不存在學員測試帳號時執行 `make prisma-seed`
- **THEN** 4 位學員帳號被建立，email 分別為 student1~4@test.com，role 為 `user`

#### Scenario: 重複執行 seed（冪等）
- **WHEN** 學員帳號已存在時再次執行 `make prisma-seed`
- **THEN** 不新增重複帳號，現有帳號的 `passwordHash` 與 `isTempPassword` 維持不變（密碼不被重置）

#### Scenario: 使用環境變數覆寫密碼
- **WHEN** 設定 `SEED_STUDENT_PASSWORD=CustomPass@99` 後執行 seed
- **THEN** 4 位學員帳號的密碼 hash 對應 `CustomPass@99`

#### Scenario: 測試學員已完成補填可直接登入
- **WHEN** 測試者重置資料庫並執行 seed 後，以 student1~4@test.com 與預設密碼登入
- **THEN** 系統不導向 `/onboarding`，也不因資料未完整而被 profile-completion-guard 轉導，直接進入 `/dashboard`

### Requirement: 學員帳號資料完整性
每位學員帳號 SHALL 包含 email、realName、nickname、phone、spiritId、role、gender、displayNameMode 欄位，且 `isTempPassword` 為 `false`，以反映已完成第一次登入補填的狀態。

#### Scenario: 學員帳號欄位驗證
- **WHEN** seed 執行完畢後查詢學員帳號
- **THEN** 每筆記錄的 role 為 `user`、`isTempPassword` 為 `false`，且 `realName` 與 `phone` 皆非空

#### Scenario: 測試學員 spiritId 採固定高位號段
- **WHEN** seed 執行完畢後查詢 student1~4@test.com 的 spiritId
- **THEN** 4 筆 spiritId 分別為 PA269001、PA269002、PA269003、PA269004，與真實名冊號段隔開

### Requirement: 明確測試帳號設定已驗證通訊 Email
seed SHALL 將明確測試帳號（`101@iwillshare.org.tw`、`gordon@test.com`、`teacher@test.com`、`student1~4@test.com`）的 `commEmail` 設為 `justin@blockcode.com.tw` 且 `isCommVerified = true`，使外寄信件依收件人解析規則集中寄至該信箱，便於測試。

#### Scenario: 測試帳號通訊 Email 已驗證
- **WHEN** seed 執行完畢後查詢上述任一明確測試帳號
- **THEN** 其 `commEmail` 為 `justin@blockcode.com.tw`，`isCommVerified` 為 `true`

#### Scenario: 測試帳號外寄信寄至通訊 Email
- **WHEN** 對某明確測試帳號寄送臨時密碼或密碼重設等外寄信
- **THEN** 依 `resolveContactEmail` 規則，收件地址為 `justin@blockcode.com.tw`

#### Scenario: 重複執行 seed 維持已驗證
- **WHEN** 重複執行 seed
- **THEN** 測試帳號的 `commEmail` 與 `isCommVerified` 維持為 `justin@blockcode.com.tw` 與 `true`
