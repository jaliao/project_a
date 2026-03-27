## Context

Dashboard 目前「授課」區塊只有「新增開課」按鈕，教師建立開課後無法在首頁看到既有記錄；「開課查詢」按鈕為 disabled 狀態尚未實作。

資料模型：
- `CourseInvite` — 開課主體，含 title、courseLevel、maxCount、expiredAt、enrollments、createdById
- `InviteEnrollment` — 學員報名記錄，關聯 CourseInvite 與 User
- `CourseOrder` — 課程訂購（選填關聯），含 courseDate（預計開課日期）

## Goals / Non-Goals

**Goals:**
- Dashboard 授課區塊上方顯示教師自己建立的開課卡片（最近 5 筆）
- 新增 `/course-sessions` 頁面，顯示教師所有開課記錄（含已結束）
- 提取共用 `CourseSessionCard` 元件，兩處共用

**Non-Goals:**
- 不實作開課詳情獨立頁面（點擊卡片暫不跳頁，僅在未來規劃）
- 不提供跨教師的開課列表（管理者後台另行處理）
- 不修改 CourseInvite 資料模型

## Decisions

### 1. 資料查詢：新增 `lib/data/course-sessions.ts`
新增獨立資料層函式 `getMyCourseSessions(userId, limit?)` 查詢 CourseInvite，include enrollments count 與 courseOrder（取 courseDate）。
- 避免在 page 和 dashboard 各自直接 query Prisma，統一來源
- 使用 `_count: { select: { enrollments: true } }` 取得已報名人數，避免 N+1

### 2. 共用元件 `CourseSessionCard`
純展示元件，接受以下 props：
- `title: string` — 課程名稱
- `courseLevel: CourseLevel` — 課程等級（用於取得 label/color）
- `courseDate: string | null` — 來自 CourseOrder.courseDate
- `maxCount: number` — 預計人數
- `enrolledCount: number` — 已接受人數
- `expiredAt: Date | null` — 邀請截止日期
- `variant?: 'compact' | 'full'` — compact 用於 Dashboard，full 用於查詢頁（預設 compact）

### 3. 「開課查詢」啟用為 Link
Dashboard 授課區塊中「開課查詢」從 disabled button 改為 `<Link href="/course-sessions">`，樣式與其他 Link 一致。

### 4. Dashboard 開課預覽區塊位置
插入在「授課」功能卡片的上方（與 `課程卡片列表` 為獨立 section），顯示最近 5 筆，超出時顯示「查看全部」連結。

## Risks / Trade-offs

- `CourseOrder.courseDate` 為 `String` 類型（非 Date），卡片直接顯示不需轉換，但格式依賴建立時的輸入一致性 → 顯示時直接輸出字串，不做格式強制轉換
- 已接受人數使用 `_count.enrollments`，代表「已報名」而非「已確認接受」，若未來有狀態欄位需再調整 → 文案用「已報名」而非「已接受」

## Migration Plan

1. 新增 `lib/data/course-sessions.ts`
2. 新增 `components/course-session/course-session-card.tsx`
3. 新增 `app/(user)/course-sessions/page.tsx`
4. 修改 `app/(user)/dashboard/page.tsx`（加入預覽列表、啟用查詢連結）

無資料庫 migration，無需 rollback 計畫。

## Open Questions

- 無
