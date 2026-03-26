## ADDED Requirements

### Requirement: CourseInvite startedAt 欄位
`CourseInvite` model SHALL 新增 `startedAt DateTime?` 欄位，有值代表課程已進入「進行中」狀態。

#### Scenario: 預設值為 null
- **WHEN** 建立新的 CourseInvite
- **THEN** `startedAt` 預設為 null（招生中狀態）

### Requirement: startCourseSession Action
系統 SHALL 提供 `startCourseSession(inviteId)` Server Action，讓講師將課程標記為「進行中」。

#### Scenario: 成功開始課程
- **WHEN** 講師呼叫 `startCourseSession`，課程尚未開始且未取消/結業
- **THEN** `startedAt` 設為當前時間，回傳 `{ success: true }`

#### Scenario: 已開始的課程不可重複操作
- **WHEN** 課程已有 `startedAt`
- **THEN** 回傳 `{ success: false, message: '課程已在進行中' }`

#### Scenario: 已取消或結業課程不可開始
- **WHEN** 課程 `cancelledAt` 或 `completedAt` 不為 null
- **THEN** 回傳 `{ success: false }`

#### Scenario: 非講師不可操作
- **WHEN** 非課程建立者呼叫
- **THEN** 回傳 `{ success: false, message: '無權限' }`

### Requirement: 課程詳情頁「開始上課」按鈕
課程詳情頁講師操作區 SHALL 在課程為招生中狀態時顯示「開始上課」按鈕，點擊後呼叫 `startCourseSession`。

#### Scenario: 招生中顯示開始上課按鈕
- **WHEN** 課程 `startedAt = null`、`cancelledAt = null`、`completedAt = null`
- **THEN** 顯示「開始上課」按鈕

#### Scenario: 進行中不顯示開始上課按鈕
- **WHEN** 課程 `startedAt != null`
- **THEN** 不顯示「開始上課」按鈕

#### Scenario: 點擊開始上課成功
- **WHEN** 講師點擊「開始上課」並確認
- **THEN** 課程狀態變為進行中，頁面刷新，toast 顯示「課程已開始`

### Requirement: CourseSessionCard 狀態 Badge
`CourseSessionCard` SHALL 在傳入狀態 props（`startedAt`、`cancelledAt`、`completedAt`）時，於卡片右上角顯示對應狀態 Badge。

| 狀態 | Badge 文字 | 顏色 |
|------|-----------|------|
| 招生中 | 招生中 | 藍色 |
| 進行中 | 進行中 | 綠色 |
| 已結業 | 已結業 | 灰色 |
| 已取消 | 已取消 | 紅色 |

#### Scenario: 傳入狀態 props 顯示 Badge
- **WHEN** `CourseSessionCard` 收到 `startedAt`、`cancelledAt`、`completedAt` props
- **THEN** 根據狀態優先順序（cancelled > completed > active > recruiting）顯示對應 Badge

#### Scenario: 未傳入狀態 props 不顯示 Badge
- **WHEN** `CourseSessionCard` 未傳入狀態 props（向下相容）
- **THEN** 不顯示任何狀態 Badge

### Requirement: CourseSessionCard 學員進度 bar
`CourseSessionCard` SHALL 在學員人數下方顯示進度 bar，視覺化 `enrolledCount / maxCount` 比例。

#### Scenario: 進度 bar 顯示比例
- **WHEN** 渲染 CourseSessionCard
- **THEN** 進度 bar 寬度為 `min(enrolledCount / maxCount * 100, 100)%`

#### Scenario: 已滿員時 bar 為滿版
- **WHEN** `enrolledCount >= maxCount`
- **THEN** 進度 bar 寬度為 100%

### Requirement: 學員課程列表 RWD 網格
學員專屬頁面的三狀態課程列表 SHALL 使用 RWD 網格排版：手機垂直單欄（`grid-cols-1`），寬螢幕雙欄（`sm:grid-cols-2`）。

#### Scenario: 手機寬度單欄顯示
- **WHEN** 視窗寬度小於 sm breakpoint（640px）
- **THEN** 課程卡片單欄垂直排列

#### Scenario: 寬螢幕雙欄顯示
- **WHEN** 視窗寬度大於等於 640px
- **THEN** 課程卡片雙欄並排顯示
