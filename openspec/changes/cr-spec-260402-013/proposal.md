## Why

目前資料庫中存在兩筆手動建立的課程邀請（啟動靈人、啟動豐盛），以及黃國倫在兩堂課的結業紀錄，但 `prisma/seed.ts` 缺少這些資料。重新執行 seed 後會遺失課程與結業狀態，導致黃國倫無法授課（canTeach = false）。本 CR 將此快照補入 seed，確保開發環境可完整重建。

## What Changes

- `prisma/seed.ts` 補充兩筆 `CourseInvite`（由管理員建立，已結業）：
  - 啟動靈人（courseCatalogId=1）
  - 啟動豐盛（courseCatalogId=2）
- 補充黃國倫的兩筆 `InviteEnrollment`（status=approved、graduatedAt 已設定）
- 使用冪等寫法（先查再建），避免重跑 seed 產生重複資料

## Capabilities

### New Capabilities
- `seed-course-completions`: 補充管理員建立的示範課程與黃國倫結業紀錄

### Modified Capabilities
（無）

## Impact

- `prisma/seed.ts` — 新增 CourseInvite + InviteEnrollment 區塊
- 無 DB schema 變更，無 migration
