# course-faq Specification

## Purpose
TBD - created by archiving change cr-spec-260611-002. Update Purpose after archive.
## Requirements
### Requirement: 課程 FAQ 留言區塊
課程詳情頁 `/course/[id]` SHALL 顯示「課程 FAQ」留言問答區塊，呈現該課程所有提問與回覆。
提問 SHALL 依時間排列，每則回覆 SHALL 顯示於對應提問之下。
FAQ 內容 SHALL 對所有可瀏覽該課程頁的登入會員公開可見。

#### Scenario: 顯示既有問答
- **WHEN** 任一登入會員開啟課程詳情頁
- **THEN** 頁面顯示課程 FAQ 區塊與既有提問／回覆

#### Scenario: 尚無留言
- **WHEN** 課程尚無任何留言
- **THEN** FAQ 區塊顯示空狀態提示

### Requirement: 會員提問
任何登入會員 SHALL 能在課程 FAQ 區塊張貼提問（top-level 留言）。
留言內容 SHALL 經驗證：trim 後非空、長度不超過 2000 字。
提問成功後 SHALL 寫入 Inbox 通知給該課程授課老師（發問者本身即老師時略過）。

#### Scenario: 會員成功提問
- **WHEN** 登入會員在提問輸入框輸入內容並送出
- **THEN** 系統建立一則 `parentId` 為空的留言並顯示於 FAQ
- **AND** 授課老師收到「新提問」Inbox 通知

#### Scenario: 空內容被拒
- **WHEN** 會員送出空白或僅空白字元的留言
- **THEN** 系統拒絕並提示需填寫內容

### Requirement: 授課老師回覆
僅該課程的授課老師（開課者本人）SHALL 能回覆提問；其他會員（含 admin/superadmin，除非本身為開課者）SHALL NOT 能回覆。
回覆成功後 SHALL 寫入 Inbox 通知給該提問的發問者（老師回覆自己提問時略過）。

#### Scenario: 老師回覆提問
- **WHEN** 授課老師在某提問下輸入回覆並送出
- **THEN** 系統建立 `parentId` 指向該提問的回覆並顯示於該提問下
- **AND** 發問者收到「課程回覆」Inbox 通知

#### Scenario: 非老師不可回覆
- **WHEN** 非開課者的會員嘗試呼叫回覆
- **THEN** 系統拒絕並回傳無權限

### Requirement: 刪除留言
發問者 SHALL 能刪除自己張貼的留言；該課程授課老師 SHALL 能刪除該課程內任意留言。
刪除提問（top-level）時 SHALL 一併刪除其下所有回覆。
刪除 SHALL NOT 發送通知。

#### Scenario: 作者刪除自己的提問
- **WHEN** 發問者對自己的提問點擊刪除並確認
- **THEN** 系統刪除該提問及其下所有回覆

#### Scenario: 老師刪除任意留言
- **WHEN** 授課老師對課程內任一留言點擊刪除並確認
- **THEN** 系統刪除該留言（若為提問則 cascade 刪回覆）

#### Scenario: 無權限者不可刪除
- **WHEN** 非作者且非授課老師者嘗試刪除某留言
- **THEN** 系統拒絕並回傳無權限

