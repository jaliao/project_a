## ADDED Requirements

### Requirement: 課程詳情頁「申請教材」按鈕
課程詳情頁講師操作區 SHALL 在課程尚未完成教材申請時顯示「申請教材」按鈕。

#### Scenario: 課程尚無 CourseOrder — 顯示申請按鈕
- **WHEN** 講師檢視課程詳情頁且 `CourseInvite.courseOrderId == null`
- **THEN** 顯示「申請教材」按鈕

#### Scenario: 課程已有 CourseOrder 且尚未收件 — 顯示檢視/修改按鈕
- **WHEN** `CourseInvite.courseOrderId != null` 且 `CourseOrder.receivedAt == null`
- **THEN** 顯示「查看教材申請」按鈕（可重新開啟表單並修改）

#### Scenario: 教材已收件 — 隱藏申請按鈕
- **WHEN** `CourseOrder.receivedAt != null`
- **THEN** 不顯示申請教材相關按鈕，改顯示「教材已收件」標籤

#### Scenario: 已取消或已結業課程 — 隱藏申請按鈕
- **WHEN** 課程 `cancelledAt != null` 或 `completedAt != null`
- **THEN** 不顯示「申請教材」按鈕

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

### Requirement: 教材寄送狀態提示
課程詳情頁 SHALL 在講師操作區顯示目前教材流程進度提示。

#### Scenario: 已申請、等待寄送
- **WHEN** `CourseOrder` 存在且 `shippedAt == null`
- **THEN** 顯示提示文字「教材申請中，等待管理者寄送」

#### Scenario: 已寄送、等待收件
- **WHEN** `CourseOrder.shippedAt != null` 且 `receivedAt == null`
- **THEN** 顯示提示文字「教材已寄出，請確認收件後開始上課」並顯示「我已收到教材」按鈕

### Requirement: 講師確認收件
課程詳情頁 SHALL 提供「我已收到教材」按鈕，講師點擊後設定 `CourseOrder.receivedAt`。

#### Scenario: 點擊確認收件成功
- **WHEN** 講師點擊「我已收到教材」且 `shippedAt != null`
- **THEN** `receivedAt` 設為當前時間，頁面刷新，顯示「已確認收件，可以開始上課了！」toast

#### Scenario: 管理者尚未標記寄送時不顯示收件按鈕
- **WHEN** `CourseOrder.shippedAt == null`
- **THEN** 不顯示「我已收到教材」按鈕

#### Scenario: 已收件後隱藏按鈕
- **WHEN** `CourseOrder.receivedAt != null`
- **THEN** 不顯示「我已收到教材」按鈕
