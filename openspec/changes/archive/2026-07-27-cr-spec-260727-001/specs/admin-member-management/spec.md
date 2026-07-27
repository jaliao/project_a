## MODIFIED Requirements

### Requirement: 條件式會員刪除
系統 SHALL 僅在環境變數 `ENABLE_MEMBER_DELETE=true` 時於詳情頁顯示刪除按鈕。刪除前 SHALL 顯示 AlertDialog 二次確認，確認後執行 hard delete。刪除操作 SHALL 於同一交易內寫入一筆 `AdminActionLog`（`action = member_delete`，含操作者與被刪除帳號之文字快照），刪除與稽核紀錄寫入 SHALL 視為單一原子操作——任一方失敗即整體回滾。

#### Scenario: 刪除按鈕依環境變數顯示
- **WHEN** `ENABLE_MEMBER_DELETE` 未設定或不為 `'true'`
- **THEN** 詳情頁不渲染任何刪除相關 UI

#### Scenario: 刪除確認流程
- **WHEN** 管理者點擊刪除按鈕並在 AlertDialog 確認
- **THEN** 系統呼叫 `deleteMember(userId)` Server Action，刪除成功後重新導向至 `/admin/members`

#### Scenario: 取消刪除
- **WHEN** 管理者在 AlertDialog 點擊取消
- **THEN** 關閉 dialog，不執行任何刪除動作

#### Scenario: 刪除成功寫入稽核紀錄
- **WHEN** 管理者確認刪除某會員且刪除成功
- **THEN** 系統寫入一筆 `AdminActionLog`（`action = member_delete`），含操作者姓名、被刪除帳號姓名與 email 之文字快照
