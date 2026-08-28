# instructor-enrollment-review Delta（cr-spec-260828-002）

## MODIFIED Requirements

### Requirement: 講師待審申請清單

課程詳情頁 SHALL 對**該課講師（`CourseInvite.createdById` 等於當前使用者）或管理者（`canAccessAdmin`）**顯示所有 `status=pending` 的 InviteEnrollment 學員，包含姓名、Email、書籍選擇，並提供「同意」按鈕。其他使用者 SHALL NOT 看到待審區塊。

#### Scenario: 有待審申請

- **WHEN** 課程有至少一筆 status=pending 的 InviteEnrollment，檢視者為該課講師或管理者
- **THEN** 頁面顯示待審區塊，列出每位學員的姓名、Email、materialChoice，以及「同意」按鈕

#### Scenario: 管理者亦可見待審清單

- **WHEN** 管理者（非該課講師）開啟有待審申請的課程詳情頁
- **THEN** 頁面顯示待審區塊與「同意」按鈕，內容與該課講師所見一致

#### Scenario: 無待審申請

- **WHEN** 課程無任何 status=pending 記錄
- **THEN** 不顯示待審區塊（或顯示空狀態「目前無待審申請」）

#### Scenario: 一般使用者不可見待審清單

- **WHEN** 非該課講師且非管理者的使用者開啟課程詳情頁
- **THEN** 不顯示待審區塊

### Requirement: 同意學員申請

該課講師或管理者點擊「同意」SHALL 將對應 InviteEnrollment.status 從 `pending` 改為 `approved`，並刷新頁面。Server Action（`approveEnrollment`）SHALL 權威驗證呼叫者為該課 `createdById` 或具 `canAccessAdmin`，否則回傳 `{ success: false, message: '無權限' }`。

#### Scenario: 同意成功

- **WHEN** 該課講師或管理者點擊某學員的「同意」按鈕
- **THEN** 系統更新 InviteEnrollment.status = approved，顯示「已同意申請」toast，該學員從待審區移至已核准清單

#### Scenario: 管理者同意申請

- **WHEN** 管理者（非該課講師）點擊待審學員的「同意」
- **THEN** 系統更新該筆 status = approved，該學員收到「報名審核通過」Inbox 通知

#### Scenario: 無權限者呼叫被拒

- **WHEN** 非該課講師且非管理者的使用者呼叫 `approveEnrollment`
- **THEN** 回傳 `{ success: false, message: '無權限' }`，不變更任何資料

#### Scenario: 同意失敗

- **WHEN** Server Action 回傳錯誤
- **THEN** 顯示「操作失敗，請稍後再試」toast
