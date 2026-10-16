## MODIFIED Requirements

### Requirement: 條件式會員刪除
系統 SHALL 僅在環境變數 `ENABLE_MEMBER_DELETE=true` 時於詳情頁顯示刪除按鈕。刪除前 SHALL 顯示 AlertDialog 二次確認，確認後執行 hard delete。刪除操作 SHALL 於同一交易內寫入一筆 `AdminActionLog`（`action = member_delete`，含操作者與被刪除帳號之文字快照），刪除與稽核紀錄寫入 SHALL 視為單一原子操作——任一方失敗即整體回滾。刪除過程中若因外鍵約束（`RESTRICT`）而無法刪除，系統 SHALL 攔截該錯誤並回傳具體的繁體中文失敗原因，不得讓例外未經處理直接中斷 Server Action；無法判斷具體原因時 SHALL 回傳通用但誠實的失敗訊息，不得顯示成功。

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

#### Scenario: 因班級仍有其他學員報名而刪除失敗
- **WHEN** 管理者嘗試刪除一個具講師身分、且其建立的班級（`CourseInvite`）底下仍有其他學員報名記錄（`InviteEnrollment`）尚未清除的會員
- **THEN** 刪除失敗，畫面顯示說明此會員是班級建立者、班級下仍有其他學員資料的具體中文訊息，會員帳號未被刪除

#### Scenario: 因曾發起站內對話而刪除失敗
- **WHEN** 管理者嘗試刪除一個曾發起過站內對話（`Conversation.createdById`）的會員
- **THEN** 刪除失敗，畫面顯示說明此會員曾發起站內對話而無法刪除的具體中文訊息，會員帳號未被刪除

#### Scenario: 因曾於站內對話發過訊息而刪除失敗
- **WHEN** 管理者嘗試刪除一個曾在站內對話中發過訊息（`ConversationMessage.authorId`）的會員
- **THEN** 刪除失敗，畫面顯示說明此會員曾發過站內訊息而無法刪除的具體中文訊息，會員帳號未被刪除

#### Scenario: 因曾於課程留言功能發過留言而刪除失敗
- **WHEN** 管理者嘗試刪除一個曾在課程留言功能發過留言（`CourseMessage.authorId`）的會員
- **THEN** 刪除失敗，畫面顯示說明此會員曾發過課程留言而無法刪除的具體中文訊息，會員帳號未被刪除

#### Scenario: 因未分類的關聯資料而刪除失敗
- **WHEN** 管理者嘗試刪除一個因外鍵約束而失敗、但該約束不在系統已知對照表中的會員
- **THEN** 刪除失敗，畫面顯示通用但誠實的失敗訊息（說明仍有其他系統資料關聯、請聯繫工程協助），不得顯示為刪除成功，且完整錯誤資訊會被記錄供後續排查
