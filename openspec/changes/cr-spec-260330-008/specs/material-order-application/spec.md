## MODIFIED Requirements

### Requirement: 教材申請表單預填資料
教材申請表單 SHALL 預先帶入現有授課相關資料，減少講師重複填寫。

預填優先順序：
1. 現有關聯 `CourseOrder` 欄位（若已存在），包含 `storeId`、`storeName`
2. `CourseInvite.courseDate`（預計開課日期）
3. `User` profile（realName → buyerNameZh、email、phone）

#### Scenario: 已有關聯 CourseOrder 時開啟表單
- **WHEN** 講師點擊「查看教材申請」
- **THEN** 表單所有欄位預填現有 CourseOrder 資料，包含已選取的 7-11 門市（顯示 `storeName（storeId）`）

#### Scenario: 無關聯 CourseOrder 時開啟表單
- **WHEN** 講師點擊「申請教材」（首次）
- **THEN** 表單以講師 Profile（姓名、Email、電話）及 CourseInvite.courseDate 預填對應欄位，`storeId` 與 `storeName` 為空

### Requirement: 教材申請表單取貨方式欄位
教材申請表單 SHALL 依選擇的取貨方式顯示對應的取貨資訊輸入 UI。

#### Scenario: 選擇 7-11 取貨時顯示門市選擇器
- **WHEN** 使用者選擇 `DeliveryMethod.sevenEleven`
- **THEN** 隱藏 `deliveryAddress` 文字輸入欄位，顯示「選取門市」按鈕（整合 `711-store-selector` capability）

#### Scenario: 選擇全家或郵寄時顯示文字欄位
- **WHEN** 使用者選擇 `DeliveryMethod.familyMart` 或 `DeliveryMethod.delivery`
- **THEN** 顯示 `deliveryAddress` 文字輸入欄位，隱藏門市選擇按鈕，`storeId` / `storeName` 維持空值

#### Scenario: 已選取 7-11 門市後顯示門市資訊
- **WHEN** `deliveryMethod == sevenEleven` 且已選取門市
- **THEN** 顯示「已選取：{storeName}（{storeId}）」，並提供「重新選取」按鈕

### Requirement: 教材申請表單提交（建立或更新 CourseOrder）
講師填寫完整表單並提交後，系統 SHALL 以 `applyMaterialOrder(inviteId, data)` Server Action 儲存資料。

#### Scenario: 首次申請成功
- **WHEN** 課程尚無 CourseOrder，講師填寫完整資料並送出
- **THEN** 新建 CourseOrder，設定 `CourseInvite.courseOrderId`，顯示「教材申請已送出」toast，Dialog 關閉

#### Scenario: 修改申請成功
- **WHEN** 課程已有 CourseOrder，講師修改資料並送出
- **THEN** 更新現有 CourseOrder（包含 `storeId`、`storeName`），顯示「教材申請已更新」toast，Dialog 關閉

#### Scenario: 選擇 7-11 但未選取門市
- **WHEN** 使用者選擇 7-11 取貨但未選取門市即送出
- **THEN** 表單顯示「請選取取貨門市」錯誤，Dialog 保持開啟

#### Scenario: 已寄送後不可修改
- **WHEN** `CourseOrder.shippedAt != null`
- **THEN** 表單欄位設為唯讀，不顯示送出按鈕

#### Scenario: 表單送出失敗
- **WHEN** 伺服器發生錯誤
- **THEN** 顯示「送出失敗，請稍後再試」toast，Dialog 保持開啟
