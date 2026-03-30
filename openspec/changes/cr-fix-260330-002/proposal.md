## Why

開課精靈 Step 1 的授課資格判斷邏輯有誤：目前以「是否完成先修課程」判斷講師資格，導致啟動靈人 1 結業者（即滿足啟動靈人 2 入學先修條件者）可錯誤開設啟動靈人 2 課程。正確邏輯應為「是否完成**該課程本身**」，即需結業啟動靈人 2 才能授課啟動靈人 2。

## What Changes

- 修正 `step-1-course-card.tsx` 中 `hasQualification` 的判斷邏輯
  - 從：`course.prerequisites.every((p) => graduatedCatalogIds.includes(p.id))`
  - 改為：`graduatedCatalogIds.includes(course.id)`

## Capabilities

### New Capabilities
（無）

### Modified Capabilities
- `create-course-wizard`：修正 Step 1 授課資格判斷條件，改為以「結業該課程本身」作為講師資格依據

## Impact

- `components/course-session/create-course-wizard/step-1-course-card.tsx`：`hasQualification` 邏輯一行修正
- 不影響資料庫、API、或其他元件
