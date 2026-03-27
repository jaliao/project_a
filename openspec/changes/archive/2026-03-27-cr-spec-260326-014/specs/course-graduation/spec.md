## ADDED Requirements

### Requirement: 結業時選擇通過學員
講師執行結業操作時，系統 SHALL 顯示 Dialog，列出所有已核准（approved）的學員供講師勾選，講師至少須勾選一位學員方可確認結業。

#### Scenario: 開啟結業 Dialog
- **WHEN** 講師在課程詳情頁點擊「結業」按鈕
- **THEN** 系統開啟 Dialog，列出所有 `status = approved` 的學員（顯示姓名與 Email），每位學員旁有勾選框

#### Scenario: 預設全選
- **WHEN** 結業 Dialog 開啟
- **THEN** 所有已核准學員預設為勾選狀態

#### Scenario: 取消勾選部分學員
- **WHEN** 講師取消勾選某位學員後確認結業
- **THEN** 該學員的 `InviteEnrollment.graduatedAt` 不設值（不獲得結業證明）

#### Scenario: 未勾選任何學員時無法確認
- **WHEN** 講師未勾選任何學員即嘗試確認結業
- **THEN** 系統顯示錯誤提示「請至少選擇一位通過結業的學員」，不執行結業

#### Scenario: 確認結業
- **WHEN** 講師勾選學員後點擊「確認結業」
- **THEN** 系統將 `CourseInvite.completedAt` 設為當前時間，被勾選學員的 `InviteEnrollment.graduatedAt` 設為當前時間，頁面更新為結業狀態

### Requirement: 無已核准學員時禁止結業
課程若沒有任何 `status = approved` 的學員，講師 SHALL 無法執行結業操作。

#### Scenario: 沒有已核准學員
- **WHEN** 課程沒有任何 approved 學員，講師點擊結業
- **THEN** 系統顯示提示「尚無已核准學員，無法結業」，不開啟 Dialog
