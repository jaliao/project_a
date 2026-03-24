## ADDED Requirements

### Requirement: Seed 腳本建立學員測試帳號
`make prisma-seed` 執行後，系統 SHALL 在資料庫中存在 4 位學員測試帳號，資料完整且密碼可用於登入。

#### Scenario: 首次執行 seed
- **WHEN** 資料庫不存在學員測試帳號時執行 `make prisma-seed`
- **THEN** 4 位學員帳號被建立，email 分別為 student1~4@test.com，role 為 `user`

#### Scenario: 重複執行 seed（冪等）
- **WHEN** 學員帳號已存在時再次執行 `make prisma-seed`
- **THEN** 不新增重複帳號，現有帳號資料維持不變（密碼不被重置）

#### Scenario: 使用環境變數覆寫密碼
- **WHEN** 設定 `SEED_STUDENT_PASSWORD=CustomPass@99` 後執行 seed
- **THEN** 4 位學員帳號的密碼 hash 對應 `CustomPass@99`

### Requirement: 學員帳號資料完整性
每位學員帳號 SHALL 包含 email、realName、nickname、spiritId、phone、role、isTempPassword 欄位。

#### Scenario: 學員帳號欄位驗證
- **WHEN** seed 執行完畢後查詢學員帳號
- **THEN** 每筆記錄的 spiritId 格式為 PA26XXXX，role 為 `user`，isTempPassword 為 `true`
