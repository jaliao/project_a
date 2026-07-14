# cancel-course-session Delta（cr-spec-260714-003）

## MODIFIED Requirements

### Requirement: 執行取消課程
確認送出後，系統 SHALL 將 `cancelledAt` 設為當前時間、`cancelReason` 寫入取消原因文字，並重新整理頁面。取消 Server Action 的守衛 SHALL 為「該課建立者或 `canAccessAdmin`」（管理者可代講師取消）。

#### Scenario: 取消成功
- **WHEN** 該課講師或管理者填寫原因並點擊確認
- **THEN** 系統更新 CourseInvite（cancelledAt = now, cancelReason = 原因文字），顯示「課程已取消」toast，頁面刷新顯示取消狀態

#### Scenario: 取消失敗（伺服器錯誤）
- **WHEN** Server Action 回傳錯誤
- **THEN** 顯示「取消失敗，請稍後再試」toast，Dialog 維持開啟

#### Scenario: 無權限者無法取消
- **WHEN** 非該課建立者且非管理者呼叫取消 Server Action
- **THEN** 回傳無權限錯誤，課程狀態不變

## ADDED Requirements

### Requirement: 重新招募作業
課程詳情頁 SHALL 於課程**進行中**（`startedAt != null` 且未結業、未取消）時，對**該課講師與管理者**顯示「重新招募作業」區塊（樣式比照結業作業）：說明文字＋「退回招生中」按鈕，點擊後 SHALL 以確認 dialog 提示影響（退回後可再邀請／核准學員；既有學員報名與教材紀錄不受影響），確認後系統 SHALL 清除 `startedAt`（課程回到招生中）。此操作 SHALL NOT 發送通知、SHALL NOT 寫入操作紀錄（LOG 範圍維持學員增刪）。Server Action 守衛 SHALL 為「該課建立者或 `canAccessAdmin`」，且僅於進行中狀態可執行。

#### Scenario: 進行中退回招生中
- **WHEN** 該課講師或管理者於進行中課程點「退回招生中」並確認
- **THEN** `startedAt` 清空，課程狀態回招生中，既有報名與教材紀錄不變

#### Scenario: 非進行中不可退回
- **WHEN** 課程為招生中、已結業或已取消時呼叫重新招募 Server Action
- **THEN** 系統拒絕並回傳狀態不符錯誤

#### Scenario: 無權限者無法操作
- **WHEN** 非該課建立者且非管理者呼叫重新招募 Server Action
- **THEN** 回傳無權限錯誤

#### Scenario: 學員不可見重新招募區塊
- **WHEN** 一般學員檢視進行中課程詳情頁
- **THEN** 不顯示重新招募作業區塊
