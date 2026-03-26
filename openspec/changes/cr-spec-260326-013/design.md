## Context

新增授課表單目前合併了開課邀請與教材訂購兩個流程，造成表單過長、職責混亂。首頁授課單元只有按鈕，無法快速預覽授課狀態。`CourseInvite` 的 `courseDate` 目前透過關聯 `CourseOrder` 讀取，若移除 CourseOrder 建立邏輯則需在 `CourseInvite` 直接儲存。

## Goals / Non-Goals

**Goals:**
- 首頁授課單元顯示最近 3 筆授課卡片，超過 3 筆時顯示「更多」導覽卡片
- 新增授課按鈕文字改為「新增授課」
- 新增授課表單移除教材訂購區塊，新增可編輯的課程名稱（含智慧預設）與備註欄位
- `CourseInvite` 新增 `courseDate`、`notes` 欄位（DB migration）
- 向後相容：既有課程的 courseDate 仍從 CourseOrder 讀取

**Non-Goals:**
- 不修改教材訂購流程本身（CourseOrder 仍保留）
- 不改動課程詳情頁（`/course/[id]`）顯示的課程名稱欄位以外的內容
- 不重構申請審核流程

## Decisions

### 1. CourseInvite 新增 courseDate 與 notes 欄位

**決定**：在 `course-invite.prisma` 新增 `courseDate String?` 與 `notes String?`，執行 migration。

**理由**：解耦 CourseInvite 與 CourseOrder 的依賴，新流程不需要建立訂購單。向後相容：`getMyCourseSessions` 讀取 `invite.courseDate ?? invite.courseOrder?.courseDate ?? null`。

### 2. 課程名稱預設值由 Form 動態產生

**決定**：`CourseSessionDialog` 接受 `instructorName: string` prop，傳入 `CourseSessionForm`。Form 監聽 `courseLevel` 欄位變化，若使用者未手動修改 title，則即時更新為 `{instructorName} 的 {courseLabel}`（例：系統管理員的啟動靈人 1）。一旦使用者手動編輯 title，停止自動覆蓋。

**實作**：以 `isDirty` flag（`useRef<boolean>`）追蹤 title 是否被手動修改。`courseLevel` 變化時，若 `!isDirty`，則 `form.setValue('title', ...)`。

**替代方案**：純 server-side 預設（action 自行產生）→ 使用者看不到預設值、無法編輯，否決。

### 3. 新增授課時不建立 CourseOrder

**決定**：`createCourseSession` action 移除 `prisma.$transaction` 中的 `courseOrder.create`，只建立 `CourseInvite`（含 courseDate、notes、title）。`courseOrderId` 維持選填，舊資料保持不變。

**理由**：教材訂購為獨立業務流程，不應強制綁定開課行為。

### 4. 首頁授課單元顯示預覽

**決定**：UserProfilePage 呼叫 `getMyCourseSessions(user.id, 4)` 取最多 4 筆。前 3 筆以 `CourseCardGrid` 渲染，第 4 筆（若存在）顯示「更多授課資訊」靜態卡片，連結至 `/user/{spiritId}/courses`。

**理由**：limit 4 讓 server 只查一次，client-side 判斷是否顯示「更多」卡片，避免額外 count query。

### 5. Zod Schema 大幅簡化

**決定**：`courseSessionSchema` 移除所有訂購欄位，新增：
- `title: z.string().min(1, '課程名稱為必填')`
- `notes: z.string().optional()`
- `courseDate: z.date(...)` 保留

舊 schema 欄位（buyerNameZh 等）直接刪除。無向後相容需求（此 schema 僅用於此表單）。

## Risks / Trade-offs

- **courseDate migration**：現有 CourseInvite 無 courseDate 欄位。新欄位為可空，不影響既有資料。getMyCourseSessions 的 fallback 邏輯確保既有課程 courseDate 仍正常顯示。→ 風險低。
- **DEV_DEFAULTS 需更新**：移除訂購欄位後舊的 DEV_DEFAULTS 會導致 TypeScript 錯誤。需更新為新 schema 欄位的測試預設值。

## Migration Plan

1. 更新 `course-invite.prisma`（新增 courseDate、notes）
2. 執行 `make schema-update name=add_course_invite_date_notes`
3. 部署時執行 `make prisma-vps3-deploy`

## Open Questions

- 授課單元中「新增授課」按鈕與卡片列表的排版順序：先顯示卡片列表，再顯示操作按鈕（符合「先看資訊再操作」的閱讀習慣）。
