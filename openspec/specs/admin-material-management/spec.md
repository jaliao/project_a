## ADDED Requirements

### Requirement: 後台教材申請管理頁路由
系統 SHALL 在 `/admin/materials` 提供教材申請管理頁，僅管理者（role = admin 或 superadmin）可存取。

#### Scenario: 管理者存取管理頁
- **WHEN** 管理者存取 `/admin/materials`
- **THEN** 頁面顯示所有教材申請列表

#### Scenario: 一般使用者存取管理頁
- **WHEN** role 非 admin/superadmin 的使用者存取
- **THEN** 重導至 `/dashboard` 或顯示 403 提示

### Requirement: 教材申請列表顯示
管理頁 SHALL 以表格形式顯示所有 CourseOrder 及其關聯 CourseInvite 資訊。

每列顯示欄位：
- 申請編號（CourseOrder.id）
- 課程名稱（CourseInvite.title）
- 申請講師（CourseInvite.createdBy 姓名）
- 購買人姓名（CourseOrder.buyerNameZh）
- 教材版本（materialVersion）
- 數量（quantity）
- 申請時間（CourseOrder.createdAt）
- 狀態標籤（待寄送 / 已寄送 / 已收件）
- 操作按鈕

#### Scenario: 有教材申請時顯示列表
- **WHEN** 資料庫有至少一筆 CourseOrder
- **THEN** 表格顯示所有記錄，依申請時間降冪排列

#### Scenario: 無教材申請時顯示空狀態
- **WHEN** 資料庫無任何 CourseOrder
- **THEN** 顯示「目前尚無教材申請」空狀態提示

### Requirement: 狀態標籤判斷規則
每筆申請 SHALL 依欄位值顯示對應狀態標籤。

| 條件 | 標籤文字 | 顏色 |
|------|---------|------|
| `receivedAt != null` | 已收件 | 綠色 |
| `shippedAt != null` 且 `receivedAt == null` | 已寄送 | 藍色 |
| `shippedAt == null` | 待寄送 | 黃色/橘色 |

#### Scenario: 顯示待寄送狀態
- **WHEN** `CourseOrder.shippedAt == null`
- **THEN** 顯示「待寄送」黃色標籤

#### Scenario: 顯示已寄送狀態
- **WHEN** `shippedAt != null` 且 `receivedAt == null`
- **THEN** 顯示「已寄送」藍色標籤

#### Scenario: 顯示已收件狀態
- **WHEN** `receivedAt != null`
- **THEN** 顯示「已收件」綠色標籤

### Requirement: 管理者確認已寄送
管理頁 SHALL 在狀態為「待寄送」的申請列顯示「確認已寄送」按鈕，點擊後呼叫 `confirmShipment(orderId)` Server Action。

#### Scenario: 點擊確認已寄送成功
- **WHEN** 管理者點擊「確認已寄送」
- **THEN** `CourseOrder.shippedAt` 設為當前時間，列表刷新，狀態更新為「已寄送」，顯示「已標記為已寄送」toast

#### Scenario: 已寄送的申請不顯示確認按鈕
- **WHEN** `CourseOrder.shippedAt != null`
- **THEN** 不顯示「確認已寄送」按鈕

#### Scenario: 非管理者無法呼叫 confirmShipment
- **WHEN** role 非 admin/superadmin 的使用者呼叫 `confirmShipment`
- **THEN** 回傳 `{ success: false, message: '無權限' }`

### Requirement: 後台申請詳情查看
管理頁 SHALL 支援點擊申請列後展開或導向詳情，顯示 CourseOrder 完整欄位（購買性質、取貨方式、電話、Email 等）。

#### Scenario: 展開詳細資料
- **WHEN** 管理者點擊某筆申請
- **THEN** 顯示該 CourseOrder 的完整購買資料
