## Context

seed.ts 目前只建立使用者、課程目錄、教會清單，沒有 CourseInvite 或 InviteEnrollment。開發環境重建後黃國倫無結業紀錄，`canTeach` 為 false，無法展示授課功能。需將目前資料庫快照補入 seed。

## Goals / Non-Goals

**Goals:**
- seed.ts 新增兩筆示範 CourseInvite（由管理員建立）與黃國倫的結業 InviteEnrollment
- 冪等：重跑 seed 不產生重複資料

**Non-Goals:**
- 不快照其他會員的學習紀錄
- 不快照 CourseOrder 資料

## Decisions

### 冪等寫法

`CourseInvite` 無自然 unique key，使用「查管理員現有 invite 數量，若為 0 則建立」的 guard：

```typescript
const adminInviteCount = await prisma.courseInvite.count({ where: { createdById: admin.id } })
if (adminInviteCount === 0) {
  // createMany invites + enrollments
}
```

### 資料來源（DB 快照 2026-04-02）

| 欄位 | 值 |
|---|---|
| invite 1 title | `系統管理員 的 啟動靈人` |
| invite 1 catalogId | 1 |
| invite 2 title | `系統管理員 的 啟動豐盛` |
| invite 2 catalogId | 2 |
| startedAt / completedAt | `2026-04-02T00:00:00.000Z` |
| 黃國倫 enrollment status | `approved` |
| 黃國倫 graduatedAt | `2026-04-02T00:00:00.000Z` |

### maxCount 與其他欄位

DB 中 `maxCount` 預設值（從 Prisma schema 確認），`expiredAt` / `cancelledAt` 均為 null。

## Migration Plan

無 DB migration，僅 seed.ts 變更。
