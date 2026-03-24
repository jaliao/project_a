## ADDED Requirements

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
確認送出後，系統 SHALL 將 `cancelledAt` 設為當前時間、`cancelReason` 寫入取消原因文字，並重新整理頁面。

#### Scenario: 取消成功
- **WHEN** 使用者填寫原因並點擊確認
- **THEN** 系統更新 CourseInvite（cancelledAt = now, cancelReason = 原因文字），顯示「課程已取消」toast，頁面刷新顯示取消狀態

#### Scenario: 取消失敗（伺服器錯誤）
- **WHEN** Server Action 回傳錯誤
- **THEN** 顯示「取消失敗，請稍後再試」toast，Dialog 維持開啟
