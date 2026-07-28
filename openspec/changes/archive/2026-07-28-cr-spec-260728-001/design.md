## Context

`CourseStatusBadge`（`components/course-session/course-status-badge.tsx`）以 `STATUS_COLORS` 這個 `Record<CourseStatus, string>` 定義四種課程狀態的 Tailwind 樣式，`recruiting`（招生中）目前為 `bg-gray-100 text-gray-600`。此為單一樣式常數的調整，不涉及跨模組、資料模型或架構變更。

## Goals / Non-Goals

**Goals:**
- 將 `recruiting` 狀態底色由灰轉為明亮的黃色系，提升與其他狀態（藍／綠／紅）並列時的辨識度。

**Non-Goals:**
- 不調整其他狀態（`active`／`completed`／`cancelled`）的樣式。
- 不改變課程狀態的判斷邏輯（`course-status.ts` 的 `getCourseStatus()`）。
- 不新增 i18n 文案或後端邏輯。

## Decisions

- 採用 `bg-yellow-100 text-yellow-700`，與既有狀態相同的 `{color}-100` 底色／`{color}-700` 文字組合模式（如 `active` 為 `bg-blue-100 text-blue-700`），維持視覺一致性。此為使用者於方案討論中確認的選擇。

## Risks / Trade-offs

- [風險] 黃色底＋深黃字在部分螢幕或色弱情境下對比度可能偏低 → 沿用專案既有 100/700 組合的既定對比模式，與其他三種狀態一致，風險可控，暫不特別處理。
