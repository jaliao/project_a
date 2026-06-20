# student-apply-prerequisite-gate Specification

## Purpose
學員在課程詳情頁申請參加前，依先修資格前置檢查「申請參加」按鈕的可用狀態。

## Requirements

### Requirement: 申請按鈕先修資格前置檢查
課程詳情頁 SHALL 於學員缺少先修課程時，將「申請參加」按鈕顯示為 `disabled`（不可點擊），並於按鈕附近逐條列出所有缺少的先修課程名稱；此時 SHALL NOT 開啟 EnrollmentApplicationDialog。學員無缺少先修時，按鈕 SHALL 維持可點擊並可開啟申請 Dialog。既有的「已申請／課程取消結業／報名截止」提前 return 邏輯 SHALL 不受影響。

#### Scenario: 有缺少先修
- **WHEN** 學員開啟課程詳情頁，且缺少一項以上先修課程
- **THEN** 「申請參加」按鈕為 disabled，並列出所有缺少的先修課程名稱，無法開啟申請 Dialog

#### Scenario: 無缺少先修
- **WHEN** 學員已完成所有先修課程
- **THEN** 「申請參加」按鈕可點擊，並可開啟 EnrollmentApplicationDialog

#### Scenario: 既有前置條件不受影響
- **WHEN** 課程已截止報名（或已取消／結業，或學員已申請）
- **THEN** 沿用既有提前 return 行為，與先修檢查無關
