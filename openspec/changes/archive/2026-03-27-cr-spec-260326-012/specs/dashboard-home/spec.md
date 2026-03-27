## MODIFIED Requirements

### Requirement: 學員首頁課程單元
學員首頁（`/user/[spiritId]`）的課程區塊 SHALL 以單一平鋪列表呈現所有未取消的已報名課程，不區分申請中 / 已開課 / 已結業子分組，依報名時間降冪排列，使用 `CourseCardGrid` 元件渲染。

#### Scenario: 有課程紀錄時顯示平鋪列表
- **WHEN** 學員載入 `/user/[spiritId]` 且有已報名課程（未取消）
- **THEN** 課程區塊顯示所有課程的卡片，無子標題分組，以 CourseCardGrid 格狀排列

#### Scenario: 無課程紀錄時顯示空狀態
- **WHEN** 學員載入 `/user/[spiritId]` 且無任何課程紀錄（或全部已取消）
- **THEN** 課程區塊顯示「尚無課程紀錄」空狀態提示

#### Scenario: 課程卡片顯示狀態徽章
- **WHEN** 課程有 startedAt / completedAt / cancelledAt 資料
- **THEN** 對應課程卡片顯示「進行中 / 已結業 / 已取消」狀態徽章

## ADDED Requirements

### Requirement: 我的開課頁面課程卡片顯示狀態
`/user/[spiritId]/courses`（我的開課）頁面的課程卡片 SHALL 顯示課程狀態徽章（招生中 / 進行中 / 已結業 / 已取消），對應 `startedAt`、`completedAt`、`cancelledAt` 欄位。

#### Scenario: 已開始課程顯示進行中
- **WHEN** 使用者載入我的開課頁面且某課程 startedAt 不為 null
- **THEN** 對應卡片顯示「進行中」徽章

#### Scenario: 已結業課程顯示已結業
- **WHEN** 使用者載入我的開課頁面且某課程 completedAt 不為 null
- **THEN** 對應卡片顯示「已結業」徽章

#### Scenario: 尚未開始課程顯示招生中
- **WHEN** 使用者載入我的開課頁面且某課程 startedAt / completedAt / cancelledAt 均為 null
- **THEN** 對應卡片顯示「招生中」徽章
