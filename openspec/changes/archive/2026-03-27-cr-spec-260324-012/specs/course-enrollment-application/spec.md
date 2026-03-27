## ADDED Requirements

### Requirement: 學員申請參加按鈕
課程詳情頁 SHALL 在學員視圖（非講師）顯示「申請參加」按鈕。若報名截止日期已過，顯示「報名截止」狀態取代按鈕；若學員已有申請記錄（pending 或 approved），顯示對應狀態而非按鈕。

#### Scenario: 可申請狀態
- **WHEN** 學員未申請過、且報名截止日期未過（或 expiredAt 為 null）、課程未取消未結業
- **THEN** 顯示「申請參加」按鈕

#### Scenario: 報名截止
- **WHEN** 當前時間晚於 CourseInvite.expiredAt
- **THEN** 顯示「報名截止」標籤，不顯示申請按鈕

#### Scenario: 已送出申請（pending）
- **WHEN** 當前學員已有 status=pending 的 InviteEnrollment
- **THEN** 顯示「申請審核中」狀態，不顯示申請按鈕

#### Scenario: 已核准（approved）
- **WHEN** 當前學員已有 status=approved 的 InviteEnrollment
- **THEN** 顯示「已加入」狀態，不顯示申請按鈕

### Requirement: 書籍選購 Dialog
點擊「申請參加」SHALL 彈出書籍選購 Dialog，學員選擇書籍需求後送出申請。

#### Scenario: 開啟書籍選購 Dialog
- **WHEN** 學員點擊「申請參加」
- **THEN** 彈出 Dialog，標題「選擇書籍」，提供三個選項：無須購買、繁體教材、簡體教材

#### Scenario: 送出申請
- **WHEN** 學員選擇一項書籍選項後點擊「確認申請」
- **THEN** 系統建立 InviteEnrollment（status=pending, materialChoice=對應值），顯示「申請已送出，等待講師審核」toast，Dialog 關閉

#### Scenario: 未選擇書籍選項
- **WHEN** 學員未選擇任何選項即點擊確認
- **THEN** 顯示「請選擇書籍選項」提示，不送出

#### Scenario: 申請失敗
- **WHEN** Server Action 回傳錯誤
- **THEN** 顯示錯誤 toast，Dialog 維持開啟

### Requirement: 學員申請資料模型
`InviteEnrollment` SHALL 包含 `status EnrollmentStatus`（預設 `pending`）與 `materialChoice MaterialChoice`（預設 `none`）欄位。

#### Scenario: 申請建立時預設 pending
- **WHEN** 學員送出申請
- **THEN** InviteEnrollment.status = pending，materialChoice = 學員選擇值

#### Scenario: 現有記錄向後相容
- **WHEN** 資料庫執行 migration
- **THEN** 現有 InviteEnrollment 記錄的 status 設為 approved（視為已核准）
