## Context

`lib/data/dashboard.ts` 的 `getDashboardStats()` 以 `prisma.user.count({ where: { roles: { has: 'teacher_X' } } })` 統計三種講師身分的總人數。`User` 對 `CourseInvite` 有 `courseInvites CourseInvite[]` 關聯（`CourseInvite.createdById` 指向建立課程的講師）。本變更僅新增查詢欄位與畫面呈現，不涉及資料庫 schema 異動。

## Goals / Non-Goals

**Goals:**
- 三張講師身分卡片（啟動／豐盛／得勝）各自新增「已開課人數」，與既有總人數並列呈現
- 「已開課」＝該講師至少建立過一筆 `CourseInvite`（不限課程目前狀態，招募中／進行中／已結業／已放棄皆算已開課）

**Non-Goals:**
- 不新增獨立圖表或區塊，不調整現有版面結構（三張 StatCard 維持）
- 不依課程狀態（已開始／已結業）細分「已開課」子類別——CR 說明中「必要時再細分」本次不做，維持單一「已開課」口徑即可满足驗證標準

## Decisions

- **查詢方式**：於 `getDashboardStats()` 的 `Promise.all` 中，三種講師身分各新增一筆 `prisma.user.count({ where: { roles: { has: 'teacher_X' }, courseInvites: { some: {} } } })`，取代另外用 `groupBy(createdById)` 再比對身分的作法——理由：講師身分數量少（三種），直接用 `some: {}` relation filter 語意清楚、查詢成本與現有身分計數相同量級，不需額外的 in-memory 比對邏輯。
- **型別**：`DashboardStats` 新增 `spiritInstructorsActive` / `richInstructorsActive` / `victoryInstructorsActive` 三個欄位，對應既有 `spiritInstructors` / `richInstructors` / `victoryInstructors`。
- **畫面呈現**：沿用既有 StatCard，數值格式改為「已開課人數／總人數」（例如「3／5」），不新增卡片。

## Risks / Trade-offs

- [Risk] 若未來講師身分種類增加，`Promise.all` 查詢數量線性增加 → 目前僅 3 種身分，查詢成本可忽略，暫不做通用化處理
- [Risk] 「已開課」採「曾建立過課程」口徑，與「進行中」課程分析卡片的四狀態分類不同 → 已於 proposal 明確定義口徑，避免與課程分析指標混淆
