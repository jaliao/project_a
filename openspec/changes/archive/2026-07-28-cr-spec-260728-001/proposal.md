## Why

課程狀態標籤「招生中」目前底色為灰色（`bg-gray-100 text-gray-600`），與其他狀態（進行中＝藍、已結業＝綠、已取消＝紅）相比不夠醒目，使用者難以一眼辨識哪些課程正在招生。改為明亮的黃色可提升辨識度。

## What Changes

- 將 `CourseStatusBadge` 中 `recruiting`（招生中）狀態的樣式，由 `bg-gray-100 text-gray-600` 改為 `bg-yellow-100 text-yellow-700`，與其他狀態一致採用 `{color}-100` 底色／`{color}-700` 文字的組合。

## Capabilities

### New Capabilities
（無）

### Modified Capabilities
- `course-status`：新增「招生中狀態標籤底色」需求，明訂招生中狀態的視覺樣式（黃色系）

## Impact

- `components/course-session/course-status-badge.tsx`：`STATUS_COLORS.recruiting` 樣式調整。
- 純前端樣式異動，無資料庫、API 或業務邏輯影響。
