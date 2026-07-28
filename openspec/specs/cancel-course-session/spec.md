# cancel-course-session Specification

## Purpose
TBD - normalized for archive compatibility. Update Purpose for cancel-course-session.

## Requirements

### Requirement: 取消課程按鈕
課程詳情頁底部 SHALL 顯示「取消課程」按鈕，僅在課程未取消時顯示。

#### Scenario: 課程未取消時顯示按鈕
- **WHEN** CourseInvite.cancelledAt 為 null
- **THEN** 頁面底部顯示「取消課程」按鈕

#### Scenario: 課程已取消時隱藏按鈕
- **WHEN** CourseInvite.cancelledAt 不為 null
- **THEN** 頁面不顯示「取消課程」按鈕

### Requirement: 取消課程確認 Dialog
點擊「取消課程」SHALL 彈出確認 Dialog，要求填寫取消原因後方可送出。

#### Scenario: 開啟取消 Dialog
- **WHEN** 使用者點擊「取消課程」按鈕
- **THEN** 系統彈出確認 Dialog，標題為「確認取消課程」

#### Scenario: 未填寫取消原因時無法送出
- **WHEN** 使用者未選擇或未填寫取消原因即點擊確認
- **THEN** 系統顯示「請填寫取消原因」提示，不執行取消

#### Scenario: 點擊取消關閉 Dialog
- **WHEN** 使用者點擊 Dialog 中的「取消」或關閉按鈕
- **THEN** Dialog 關閉，課程不受影響

### Requirement: 取消原因輸入
Dialog SHALL 提供下拉選單供選擇預設原因，選擇「其他」時顯示 textarea 自行填寫。

#### Scenario: 選擇預設原因「人數不足」
- **WHEN** 使用者從下拉選單選擇「人數不足」
- **THEN** 不顯示 textarea，最終存入資料庫的 cancelReason 為「人數不足」

#### Scenario: 選擇預設原因「時間因素」
- **WHEN** 使用者從下拉選單選擇「時間因素」
- **THEN** 不顯示 textarea，最終存入資料庫的 cancelReason 為「時間因素」

#### Scenario: 選擇「其他」顯示 textarea
- **WHEN** 使用者從下拉選單選擇「其他」
- **THEN** 頁面顯示 textarea，使用者可自行填寫原因

#### Scenario: 「其他」未填寫 textarea 無法送出
- **WHEN** 使用者選擇「其他」但 textarea 為空即點擊確認
- **THEN** 系統顯示「請填寫取消原因」提示，不執行取消

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

### Requirement: 結業回退作業
課程詳情頁 SHALL 於課程**已結業**（`completedAt != null` 且未取消）時，對**該課講師與管理者**顯示「結業回退作業」區塊（樣式比照重新招募作業）：說明文字＋「退回進行中」按鈕，點擊後 SHALL 以確認 dialog 提示影響（將清除課程結業標記、班級評分與心得、全部學員的結業標記；已寄出的結業信無法收回，若日後重新結業將對同一批學員再寄一次結業信），確認後系統 SHALL 於單一交易內：清除 `CourseInvite.completedAt`／`gradRating`／`gradTestimony`，並清除該課全部 `InviteEnrollment.graduatedAt`／`nonGraduateReason`（回復為 approved、未結業）。此操作 SHALL NOT 發送通知、SHALL NOT 寄送任何信件、SHALL NOT 寫入操作紀錄。Server Action 守衛 SHALL 為「該課建立者或 `canAccessAdmin`」，且僅於已結業狀態可執行。

#### Scenario: 已結業退回進行中
- **WHEN** 該課講師或管理者於已結業課程點「退回進行中」並確認
- **THEN** `CourseInvite.completedAt`／`gradRating`／`gradTestimony` 清空，課程狀態回進行中；該課全部學員 `graduatedAt`／`nonGraduateReason` 清空

#### Scenario: 非已結業不可退回
- **WHEN** 課程為招生中、進行中或已取消時呼叫結業回退 Server Action
- **THEN** 系統拒絕並回傳狀態不符錯誤（「僅已結業的課程可退回進行中」）

#### Scenario: 無權限者無法操作
- **WHEN** 非該課建立者且非管理者呼叫結業回退 Server Action
- **THEN** 回傳無權限錯誤

#### Scenario: 學員不可見結業回退區塊
- **WHEN** 一般學員檢視已結業課程詳情頁
- **THEN** 不顯示結業回退作業區塊

#### Scenario: 確認視窗明示重複寄信風險
- **WHEN** 該課講師或管理者點擊「退回進行中」開啟確認 dialog
- **THEN** dialog 內容明確提示已寄出的結業信無法收回，若日後重新結業將對同一批學員再次寄送結業信

#### Scenario: 不影響證書資格佇列與已產生證書
- **WHEN** 已結業課程執行結業回退
- **THEN** 系統不修改任何 `CertificateProduction` 紀錄（不隨本操作自動處理實體證書狀態）
