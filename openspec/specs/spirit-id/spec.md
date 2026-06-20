# spirit-id Specification

## Purpose
TBD - normalized for archive compatibility. Update Purpose for spirit-id.

## Requirements

### Requirement: Spirit ID 自動核發
系統 SHALL 在會員帳號建立成功後，自動核發一個永久唯一的 Spirit ID，格式為 `PA` + 西元年後兩位 + 四位流水號（補零）。

#### Scenario: 首位會員註冊
- **WHEN** 2026 年第一位會員完成 Email 或 Google 註冊
- **THEN** 系統核發 Spirit ID `PA260001`

#### Scenario: 同年第二位會員
- **WHEN** 同年已有 1 筆 Spirit ID 核發後，第二位會員完成註冊
- **THEN** 系統核發 Spirit ID `PA260002`

#### Scenario: 跨年流水號重置
- **WHEN** 2027 年第一位會員完成註冊
- **THEN** 系統核發 Spirit ID `PA270001`（流水號從 0001 重新計算）

### Requirement: Spirit ID 唯一性保證
系統 SHALL 確保 Spirit ID 在全系統內不重複，即使在高並發情境下亦然。

#### Scenario: 並發註冊不重複
- **WHEN** 多位使用者同時完成註冊
- **THEN** 每位使用者獲得不同的 Spirit ID，無任何重複

### Requirement: Spirit ID 不可變更
Spirit ID 一經核發 SHALL NOT 允許被修改，包含使用者自行修改或管理員操作。

#### Scenario: 使用者嘗試修改 Spirit ID
- **WHEN** 使用者於 Profile 頁面提交含 Spirit ID 修改的請求
- **THEN** 系統拒絕該修改，Spirit ID 保持原值不變

### Requirement: UI 統一使用「啟動編號」顯示 spiritId
系統所有使用者介面 SHALL 以「啟動編號」作為 `spiritId` 欄位的顯示名稱，不再使用「靈人編號」或「Spirit ID」。

#### Scenario: Onboarding Step 3 顯示啟動編號
- **WHEN** 使用者完成 Onboarding 進入 Step 3 歡迎畫面
- **THEN** 編號區塊標籤顯示「您的啟動編號」

#### Scenario: 個人資料頁顯示啟動編號
- **WHEN** 使用者開啟個人資料頁（`/user/[spiritId]`）
- **THEN** 編號欄位標籤顯示「啟動編號」，不顯示「Spirit ID」

#### Scenario: 課程邀請輸入框提示啟動編號
- **WHEN** 講師使用邀請功能輸入學員編號
- **THEN** 輸入框 placeholder 顯示「輸入啟動編號（例：PA260001）」
