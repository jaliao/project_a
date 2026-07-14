# course-graduation Delta（cr-spec-260714-003）

## MODIFIED Requirements

### Requirement: 結業時選擇通過學員
**該課講師或管理者**執行結業操作時，系統 SHALL 顯示結業流程頁，列出所有已核准（approved）的學員供勾選，至少須勾選一位學員方可確認結業。結業 Server Action 與結業頁 `/course/[id]/graduate` 的守衛 SHALL 為「該課建立者或 `canAccessAdmin`」。

#### Scenario: 開啟結業流程
- **WHEN** 該課講師或管理者在課程詳情頁點擊「結業」按鈕
- **THEN** 系統開啟結業流程，列出所有 `status = approved` 的學員（顯示姓名與 Email），每位學員旁有勾選框

#### Scenario: 預設全選
- **WHEN** 結業流程開啟
- **THEN** 所有已核准學員預設為勾選狀態

#### Scenario: 取消勾選部分學員
- **WHEN** 操作者取消勾選某位學員後確認結業
- **THEN** 該學員的 `InviteEnrollment.graduatedAt` 不設值（不獲得結業證明）

#### Scenario: 未勾選任何學員時無法確認
- **WHEN** 操作者未勾選任何學員即嘗試確認結業
- **THEN** 系統顯示錯誤提示「請至少選擇一位通過結業的學員」，不執行結業

#### Scenario: 確認結業
- **WHEN** 操作者勾選學員後點擊「確認結業」
- **THEN** 系統將 `CourseInvite.completedAt` 設為當前時間，被勾選學員的 `InviteEnrollment.graduatedAt` 設為當前時間，頁面更新為結業狀態

#### Scenario: 無權限者無法結業
- **WHEN** 非該課建立者且非管理者呼叫結業 Server Action 或存取結業頁
- **THEN** 系統拒絕（action 回無權限；頁面轉導／拒絕）
