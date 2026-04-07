## MODIFIED Requirements

### Requirement: 顯示課程狀態標籤
課程詳情頁標題旁 SHALL 依 CourseInvite 狀態顯示對應標籤，四種狀態須全數涵蓋。

#### Scenario: 課程已取消
- **WHEN** CourseInvite.cancelledAt 不為 null
- **THEN** 顯示「已取消」標籤（紅色），並顯示取消原因

#### Scenario: 課程已結業
- **WHEN** CourseInvite.completedAt 不為 null 且 cancelledAt 為 null
- **THEN** 顯示「已結業」標籤（綠色）

#### Scenario: 課程進行中
- **WHEN** cancelledAt 與 completedAt 皆為 null，且 CourseInvite.startedAt 不為 null
- **THEN** 顯示「進行中」標籤（藍色）

#### Scenario: 課程招生中
- **WHEN** cancelledAt 與 completedAt 皆為 null，且 CourseInvite.startedAt 為 null
- **THEN** 顯示「招生中」標籤（灰色）

### Requirement: 講師專屬：複製邀請連結
講師（CourseInvite.createdById == 當前使用者）SHALL 在頁首右側看到「複製邀請連結」按鈕，點擊後複製 `/invite/{token}` 連結至剪貼簿。

#### Scenario: 講師複製連結
- **WHEN** 講師點擊頁首右上角的「複製邀請連結」按鈕
- **THEN** 連結複製至剪貼簿，按鈕短暫顯示「已複製！」

#### Scenario: 複製按鈕位置
- **WHEN** 講師開啟課程詳情頁
- **THEN** 複製邀請連結按鈕顯示於頁首標題列右側，與課程狀態標籤同排

### Requirement: 講師專屬：結業按鈕顯示條件
結業按鈕 SHALL 僅在課程處於進行中狀態時顯示，招生中、已取消、已結業時均不顯示。

#### Scenario: 課程進行中時顯示結業按鈕
- **WHEN** 講師查看課程詳情頁，且 isStarted = true、isCancelled = false、isCompleted = false
- **THEN** 顯示「結業」按鈕

#### Scenario: 課程招生中時不顯示結業按鈕
- **WHEN** 講師查看課程詳情頁，且 CourseInvite.startedAt 為 null
- **THEN** 不顯示「結業」按鈕

#### Scenario: 課程已取消或已結業時不顯示結業按鈕
- **WHEN** isCancelled = true 或 isCompleted = true
- **THEN** 整個操作區塊不渲染（既有行為不變）
