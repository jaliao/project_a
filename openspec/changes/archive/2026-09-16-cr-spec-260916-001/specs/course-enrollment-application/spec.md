## MODIFIED Requirements

### Requirement: 書籍選購 Dialog
點擊「申請參加」SHALL 彈出書籍選購 Dialog，學員選擇書籍需求後送出申請。Dialog 開啟時 SHALL 預先選取「繁體教材」選項（學員送出前仍可自由改選其他三個選項或「已有教材」）。

#### Scenario: 開啟書籍選購 Dialog
- **WHEN** 學員點擊「申請參加」
- **THEN** 彈出 Dialog，標題「選擇書籍」，提供四個選項：已有教材、繁體教材、簡體教材、英文教材，且「繁體教材」為預先選取狀態

#### Scenario: 送出申請
- **WHEN** 學員選擇一項書籍選項後點擊「確認申請」
- **THEN** 系統建立 InviteEnrollment（status=pending, materialChoice=對應值），顯示「申請已送出，等待講師審核」toast，Dialog 關閉

#### Scenario: 未選擇書籍選項
- **WHEN** 送出時 Dialog 內部狀態為未選擇任一選項（正常操作流程下因預選「繁體教材」不會發生，僅作為程式防禦性檢查）
- **THEN** 顯示「請選擇書籍選項」提示，不送出

#### Scenario: 申請失敗
- **WHEN** Server Action 回傳錯誤
- **THEN** 顯示錯誤 toast，Dialog 維持開啟

#### Scenario: 選擇英文教材送出申請
- **WHEN** 學員將預選之「繁體教材」改選為「英文教材」選項後點擊「確認申請」
- **THEN** 系統建立 InviteEnrollment（status=pending, materialChoice=english），顯示「申請已送出，等待講師審核」toast，Dialog 關閉

### Requirement: 學員申請參加按鈕
課程詳情頁 SHALL 在學員視圖（非講師）顯示「申請參加」按鈕。若報名截止日期已過，顯示「報名截止」狀態取代按鈕；若學員已有申請記錄（pending 或 approved），顯示對應狀態而非按鈕。已核准（approved）狀態 SHALL 額外顯示目前教材選擇摘要與（未鎖定時的）變更入口，詳見「已核准學員之教材選擇檢視與變更」需求。

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
- **THEN** 顯示「已加入」狀態與目前教材選擇摘要，不顯示「申請參加」按鈕

### Requirement: 學員申請資料模型
`InviteEnrollment` SHALL 包含 `status EnrollmentStatus`（預設 `pending`）與 `materialChoice MaterialChoice`（預設 `none`）欄位。

#### Scenario: 申請建立時預設 pending
- **WHEN** 學員送出申請
- **THEN** InviteEnrollment.status = pending，materialChoice = 學員選擇值

#### Scenario: 現有記錄向後相容
- **WHEN** 資料庫執行 migration
- **THEN** 現有 InviteEnrollment 記錄的 status 設為 approved（視為已核准）

## ADDED Requirements

### Requirement: 已核准學員之教材選擇檢視與變更
已核准（approved）的學員 SHALL 能在課程詳情頁檢視自己目前的教材選擇，並在該班教材申請尚未被講師「確認完成」（`CourseInvite.materialFinalizedAt` 為 null）前，重新開啟書籍選購 Dialog 變更教材選擇（含教材所屬姓名）。變更 SHALL 僅限學員本人操作，且僅能修改自己的 `InviteEnrollment`。教材申請一旦被講師「確認完成」，系統 SHALL 拒絕變更並提示「教材已確認申請，如需異動請洽老師」。

#### Scenario: 檢視教材選擇摘要
- **WHEN** 已核准學員檢視課程詳情頁
- **THEN** 於「已加入」狀態下方顯示目前教材選擇（如「繁體教材」或「已有教材」）

#### Scenario: 教材申請尚未鎖定時可變更
- **WHEN** 已核准學員點擊「變更教材選擇」，且該班 `materialFinalizedAt` 為 null
- **THEN** 開啟書籍選購 Dialog（標題「變更教材選擇」），預帶目前選項與教材姓名，送出後更新該筆報名的 `materialChoice`／`materialBookName`，顯示「教材選擇已更新」toast

#### Scenario: 教材申請已鎖定時無法變更
- **WHEN** 該班 `materialFinalizedAt` 已有值
- **THEN** 課程詳情頁不顯示「變更教材選擇」按鈕，改顯示提示文字「教材已確認申請，如需異動請洽老師」

#### Scenario: 非本人嘗試變更
- **WHEN** 呼叫變更教材選擇的 Server Action 之使用者非該筆報名的 `userId`
- **THEN** 系統回傳 `{ success: false, message: '無權限' }`，不修改任何資料

#### Scenario: 未核准狀態不適用
- **WHEN** 學員報名狀態為 pending
- **THEN** 系統不提供「變更教材選擇」入口，維持既有「申請審核中」呈現
