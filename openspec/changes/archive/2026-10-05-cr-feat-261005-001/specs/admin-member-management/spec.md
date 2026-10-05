## ADDED Requirements

### Requirement: 班級轉移
會員詳情頁「授課紀錄」區塊 SHALL 在該會員名下有至少一個班級（`CourseInvite`）時顯示「轉移班級」操作入口。管理者點擊後 SHALL 能以勾選清單選擇要轉移的班級（預設全選，可取消勾選排除特定班級）並選擇目標老師，確認後系統 SHALL 將勾選班級的建立者（`CourseInvite.createdById`）改為目標老師。此操作 SHALL 僅限管理者（`admin`／`superadmin`）執行，不開放一般老師對自己或他人名下班級執行轉移。

目標老師 SHALL 針對勾選班級涵蓋的每個課程目錄（`courseCatalogId`），實際持有對應的書籍講師身分（`teacher_1`／`teacher_2`／`teacher_3`）；僅具備後台管理者身分但未持有對應書籍講師身分者，不視為合格目標老師。任一班級所需身分目標老師未持有時，系統 SHALL 拒絕整批轉移並列出缺少的書籍名稱，不得只轉移部分班級。

轉移成功 SHALL 於單一交易內完成資料異動，且針對每個被轉移的班級各寫入一筆 `AdminActionLog`（`action = course_invite_transfer`），含操作者、目標老師（文字快照）、被轉移班級（`inviteId`/`inviteTitle`）與來源老師（文字快照於 `detail`）。

#### Scenario: 顯示轉移入口
- **WHEN** 管理者檢視一個具備至少一個班級的會員詳情頁
- **THEN** 「授課紀錄」區塊顯示「轉移班級」按鈕

#### Scenario: 無班級時不顯示轉移入口
- **WHEN** 管理者檢視一個沒有任何班級的會員詳情頁
- **THEN** 「授課紀錄」區塊不顯示「轉移班級」按鈕

#### Scenario: 預設全選班級清單
- **WHEN** 管理者點擊「轉移班級」開啟 Dialog
- **THEN** 該會員名下所有班級以勾選清單呈現，且預設全部勾選

#### Scenario: 可取消勾選排除特定班級
- **WHEN** 管理者在清單中取消勾選某幾個班級
- **THEN** 確認轉移後，僅勾選的班級被轉移，未勾選的班級仍屬於原老師

#### Scenario: 目標老師具備對應身分時轉移成功
- **WHEN** 管理者勾選一個或多個班級、選定一位實際具備這些班級所需書籍講師身分的老師並確認
- **THEN** 勾選班級的 `CourseInvite.createdById` 全部改為該老師，系統顯示轉移成功訊息，且每個被轉移的班級各寫入一筆 `AdminActionLog`（`action = course_invite_transfer`）

#### Scenario: 目標老師缺少對應身分時整批拒絕
- **WHEN** 管理者勾選的班級涵蓋某個課程目錄、但選定的目標老師未實際持有該課程目錄對應的書籍講師身分
- **THEN** 轉移失敗，系統顯示列出缺少身分之書籍名稱的具體中文訊息，所有勾選班級皆未被轉移

#### Scenario: 僅具管理者身分但無對應書籍講師身分者不符資格
- **WHEN** 選定的目標老師具備 `admin` 或 `superadmin` 身分，但未持有勾選班級所需的書籍講師身分
- **THEN** 轉移失敗，不因其管理者身分而放行（管理者身分不視為書籍講師身分的替代）

#### Scenario: 非管理者無法執行轉移
- **WHEN** 一般老師（無 `admin`／`superadmin` 身分）嘗試呼叫轉移班級的 Server Action
- **THEN** 系統拒絕並回傳無權限訊息，不執行任何資料異動

#### Scenario: 轉移後原班級學員報名與結業紀錄不受影響
- **WHEN** 某班級已有學員報名記錄（`InviteEnrollment`）或結業紀錄
- **THEN** 轉移該班級的建立者後，這些學員的報名記錄、結業紀錄維持不變，僅 `CourseInvite.createdById` 改變
