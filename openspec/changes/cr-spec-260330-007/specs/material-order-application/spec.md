## MODIFIED Requirements

### Requirement: 教材申請表單預填資料
教材申請表單 SHALL 預先帶入現有授課相關資料，減少講師重複填寫。

預填優先順序：
1. 現有關聯 `CourseOrder` 欄位（若已存在）
2. `CourseInvite.courseDate`（預計開課日期）
3. `User` profile（realName → buyerNameZh、email、phone）

#### Scenario: 已有關聯 CourseOrder 時開啟表單
- **WHEN** 講師點擊「查看教材申請」
- **THEN** 表單所有欄位預填現有 CourseOrder 資料

#### Scenario: 無關聯 CourseOrder 時開啟表單
- **WHEN** 講師點擊「申請教材」（首次）
- **THEN** 表單以講師 Profile（姓名、Email、電話）及 CourseInvite.courseDate 預填對應欄位，其餘欄位空白

### Requirement: 教材申請表單欄位（調整後）
教材申請表單 SHALL 包含以下欄位，移除書籍相關欄位（改由學員資料自動統計）。

**保留欄位：**
- 購買人中文姓名（buyerNameZh）
- 購買人英文姓名（buyerNameEn）
- 教師姓名（teacherName）
- 所屬教會/單位（churchOrg）
- Email
- 電話（phone）
- 取貨方式（deliveryMethod：7-11 / 全家 / 郵寄宅配）
- 地址（deliveryAddress）：便利商店填門市店號/名稱，宅配填完整收件地址
- 統一編號（taxId，選填）
- 預計開課日期（courseDate）

**移除欄位：**
- 教材版本（materialVersion）
- 購買性質（purchaseType）
- 代購學員姓名（studentNames）
- 數量（quantity / quantityNote）

#### Scenario: 地址欄 label 依取貨方式切換
- **WHEN** 使用者選擇 7-11 或全家取貨
- **THEN** 地址欄位 label 顯示「門市店號 / 門市名稱」

#### Scenario: 宅配時地址欄 label 為收件地址
- **WHEN** 使用者選擇郵寄/宅配
- **THEN** 地址欄位 label 顯示「收件地址」

#### Scenario: 表單不再顯示書籍相關欄位
- **WHEN** 講師開啟教材申請表單
- **THEN** 表單不顯示教材版本、購買性質、代購學員姓名、數量等欄位

### Requirement: 教材申請表單提交（建立或更新 CourseOrder）
講師填寫完整表單並提交後，系統 SHALL 以 `applyMaterialOrder(inviteId, data)` Server Action 儲存資料。

#### Scenario: 首次申請成功
- **WHEN** 課程尚無 CourseOrder，講師填寫完整資料並送出
- **THEN** 新建 CourseOrder，設定 `CourseInvite.courseOrderId`，顯示「教材申請已送出」toast，Dialog 關閉

#### Scenario: 修改申請成功
- **WHEN** 課程已有 CourseOrder，講師修改資料並送出
- **THEN** 更新現有 CourseOrder，顯示「教材申請已更新」toast，Dialog 關閉

#### Scenario: 已寄送後不可修改
- **WHEN** `CourseOrder.shippedAt != null`（管理者已確認寄送）
- **THEN** 表單欄位設為唯讀，不顯示送出按鈕

#### Scenario: 表單送出失敗
- **WHEN** 伺服器發生錯誤
- **THEN** 顯示「送出失敗，請稍後再試」toast，Dialog 保持開啟

## REMOVED Requirements

### Requirement: 教材版本與數量由講師填寫
**Reason**: 書本版本與數量改為從學員 `InviteEnrollment.materialChoice` 自動統計，不再由講師重複填寫。
**Migration**: CourseOrder 表單移除相關欄位；DB 欄位（materialVersion/purchaseType/studentNames/quantity/quantityNote）暫保留，不影響既有資料。
