## Context

目前首頁（`/user/[spiritId]`）課程區塊以三個子標題（申請中 / 已開課 / 已結業）分組顯示，造成資訊碎片化。`/user/[spiritId]/courses`（我的開課）與首頁課程區各自硬編 grid 欄數，RWD 規則不一致，且課程卡片缺少狀態標籤。Topbar 目前為 static 定位，在長頁面（如 `/course/[id]`）滾動後消失，造成個人資料與訊息中心按鈕無法觸達。新增課程按鈕在 Topbar 位置對學員無意義，已有其他入口。

## Goals / Non-Goals

**Goals:**
- 提取共用 `CourseCardGrid` 元件，統一兩個頁面的 RWD 網格（最多 4 欄）
- 首頁課程區塊改為單一列表（無子分組）
- `/user/[spiritId]/courses` 課程卡片補傳狀態欄位，狀態徽章正常顯示
- Topbar 改為 `sticky top-0`，所有頁面滾動後仍可操作
- 移除 Topbar「新增課程」按鈕與 CourseOrderDialog 引用

**Non-Goals:**
- 不改動課程卡片（`CourseSessionCard`）本身的 UI 樣式
- 不調整 `/course/[id]` 頁面內容排版
- 不修改課程的資料查詢邏輯（只補傳已有欄位）

## Decisions

### 1. 新增 `CourseCardGrid` 包裝元件

**決定**：建立 `components/course-session/course-card-grid.tsx`，接受 `children`，內含 Tailwind grid class：`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3`。

**理由**：兩處使用相同的欄位規則，集中管理避免日後不一致。元件只負責布局，不含資料邏輯，副作用為零。

### 2. 首頁課程區塊改為單一列表，依 `joinedAt` 降冪排列

**決定**：移除 `pendingCourses / activeCourses / completedCourses` 三組，改為單一 `enrollments`（已過濾 `cancelledAt`），使用 `CourseCardGrid` 渲染。`completedAt` / `startedAt` / `cancelledAt` 已由 `getMyEnrollments` 回傳，卡片本身會顯示狀態徽章。

**替代方案**：保留分組但加上 collapse 功能 → 複雜度增加，與「不用區分子單元」需求相反，否決。

### 3. Topbar 改為 `sticky top-0 z-50 bg-background`

**決定**：在 `<header>` 加上 `sticky top-0 z-50 bg-background` class，使 Topbar 在所有頁面保持可見。

**理由**：`/course/[id]` 是最長的頁面，Topbar 非 sticky 導致使用者必須捲回頂端才能操作。改為 sticky 是最低侵入性修法，不影響任何 layout 結構。

**為何需要 `bg-background`**：sticky 元素需要不透明背景，否則內容透過標頭。`z-50` 確保 Dialog/Sheet overlay 之外的互動層級正確。

### 4. 移除 Topbar「新增課程」按鈕

**決定**：直接從 `topbar.tsx` 移除 `<Button>` 與 `<CourseOrderDialog>` 及相關 state。

**理由**：新增課程入口已存在於 `/user/[spiritId]` 的授課單元，Topbar 放置對學員角色造成干擾。

## Risks / Trade-offs

- **sticky Topbar 與 Sheet/Dialog 層級衝突**：Topbar z-50，Radix Dialog overlay 預設 z-50。若 Sheet 開啟後 Topbar 蓋住 overlay，需調整 Sheet z-index 或 Topbar 降低到 z-40。→ 測試後微調即可，風險低。
- **首頁課程列表過長**：單一列表若學員課程數多，頁面可能過長。→ 未來可加 pagination 或 limit，本次不在 scope 內。

## Migration Plan

無資料庫異動，無需 migration。所有變更為純 UI 元件修改，deploy 後即生效。Rollback 為 git revert。

## Open Questions

- `CourseOrderDialog`（新增課程）在移除 Topbar 入口後，是否需要其他頁面補上入口？（暫定：已有 `/user/[spiritId]` 授課單元的 `CourseSessionDialog` 覆蓋主要需求，`CourseOrderDialog` 與 `CourseSessionDialog` 功能相近，後續確認是否完全廢棄）
