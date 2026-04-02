## ADDED Requirements

### Requirement: 申請表單僅需填寫取貨資訊
教材申請 Dialog SHALL 僅顯示「統一編號（選填）」與「取貨方式 / 地址」欄位，不再要求使用者填寫購買人姓名、Email、電話、教師姓名、所屬教會、開課日期。

#### Scenario: 表單只顯示取貨相關欄位
- **WHEN** 講師開啟教材申請 Dialog
- **THEN** 表單僅顯示統一編號輸入框（選填）及取貨方式選擇（7-11 / 全家 / 郵寄宅配）

#### Scenario: 超商取貨需選取門市
- **WHEN** 講師選擇 7-11 或全家取貨
- **THEN** 顯示 EcpayStoreSelector 元件，需選取門市才可送出

#### Scenario: 郵寄宅配需填收件地址
- **WHEN** 講師選擇郵寄、宅配
- **THEN** 顯示收件地址輸入框，必填才可送出

### Requirement: Server Action 自動快照會員與課程資料
`applyMaterialOrder` Server Action SHALL 在儲存 CourseOrder 時，自動從 User 與 CourseInvite 帶入快照欄位，不依賴前端傳入這些欄位。

#### Scenario: 提交時自動帶入購買人中文姓名
- **WHEN** 講師送出申請
- **THEN** `CourseOrder.buyerNameZh` 儲存為 `user.realName || user.name || '（未填）'`

#### Scenario: 提交時自動帶入購買人英文姓名
- **WHEN** 講師送出申請
- **THEN** `CourseOrder.buyerNameEn` 儲存為 `user.englishName || ''`

#### Scenario: 提交時自動帶入聯絡 Email
- **WHEN** 講師送出申請
- **THEN** `CourseOrder.email` 儲存為 `user.commEmail || user.email`

#### Scenario: 提交時自動帶入手機號碼
- **WHEN** 講師送出申請
- **THEN** `CourseOrder.phone` 儲存為 `user.phone || ''`

#### Scenario: 提交時自動帶入所屬教會/單位
- **WHEN** 講師送出申請且 churchType = 'church'
- **THEN** `CourseOrder.churchOrg` 儲存為對應 `Church.name`

#### Scenario: churchType 為 other 時帶入自填教會名稱
- **WHEN** 講師送出申請且 churchType = 'other'
- **THEN** `CourseOrder.churchOrg` 儲存為 `user.churchOther || ''`

#### Scenario: churchType 為 none 時教會欄位為空
- **WHEN** 講師送出申請且 churchType = 'none'
- **THEN** `CourseOrder.churchOrg` 儲存為 `''`

#### Scenario: 提交時自動帶入教師姓名
- **WHEN** 講師送出申請
- **THEN** `CourseOrder.teacherName` 儲存為 `invite.createdBy.realName || invite.createdBy.name || ''`（即課程開立者本人）

#### Scenario: 提交時自動帶入預計開課日期
- **WHEN** 講師送出申請
- **THEN** `CourseOrder.courseDate` 儲存為 `invite.courseDate || '無'`
