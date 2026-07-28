## ADDED Requirements

### Requirement: 招生中狀態標籤底色
課程狀態標籤（`CourseStatusBadge`）於課程為招生中（`recruiting`）狀態時，SHALL 使用黃色系樣式（`bg-yellow-100 text-yellow-700`），以與其他狀態（進行中＝藍、已結業＝綠、已取消＝紅）明顯區隔並提升辨識度。

#### Scenario: 課程招生中 — 標籤顯示黃色底
- **WHEN** 課程狀態為招生中（`startedAt = null`、`cancelledAt = null`、`completedAt = null`）
- **THEN** `CourseStatusBadge` 以 `bg-yellow-100 text-yellow-700` 樣式顯示「招生中」文字
