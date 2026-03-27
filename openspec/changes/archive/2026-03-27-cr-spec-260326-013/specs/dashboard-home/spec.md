## MODIFIED Requirements

### Requirement: 首頁授課單元顯示最近授課預覽
首頁授課單元（`/user/[spiritId]`，僅本人可見）SHALL 顯示最近最多 3 筆授課卡片，使用 `CourseCardGrid` 排列，並在下方提供「新增授課」按鈕。

#### Scenario: 有授課紀錄時顯示卡片
- **WHEN** 本人載入首頁且有建立授課（未取消）
- **THEN** 授課單元顯示最近最多 3 筆，以 CourseCardGrid 格狀排列，每張卡片可點擊連結至 `/course/{id}`

#### Scenario: 無授課紀錄時顯示空狀態
- **WHEN** 本人載入首頁且尚無授課紀錄
- **THEN** 授課單元顯示「尚無授課紀錄」空狀態提示

#### Scenario: 點擊新增授課按鈕
- **WHEN** 本人點擊授課單元的「新增授課」按鈕
- **THEN** 系統開啟 CourseSessionDialog

## ADDED Requirements

### Requirement: 授課單元「更多授課資訊」導覽卡片
當使用者的授課紀錄超過 3 筆時，授課單元 SHALL 在第 3 張卡片之後顯示一張「更多授課資訊」卡片（相同尺寸），點擊後導向 `/user/{spiritId}/courses`。

#### Scenario: 授課超過 3 筆時顯示更多卡片
- **WHEN** 本人載入首頁且授課紀錄超過 3 筆
- **THEN** 授課單元顯示前 3 筆卡片，第 4 格為「更多授課資訊」卡片

#### Scenario: 點擊更多授課資訊卡片
- **WHEN** 使用者點擊「更多授課資訊」卡片
- **THEN** 系統導向 `/user/{spiritId}/courses`

#### Scenario: 授課恰好 3 筆時不顯示更多卡片
- **WHEN** 本人載入首頁且授課紀錄恰好為 3 筆
- **THEN** 顯示 3 張卡片，無「更多授課資訊」卡片
