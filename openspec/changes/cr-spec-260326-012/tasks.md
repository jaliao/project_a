## 1. 新增 CourseCardGrid 元件

- [x] 1.1 建立 `components/course-session/course-card-grid.tsx`，包含 `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3` 網格樣式，接受 `children` prop

## 2. 修改 Topbar

- [x] 2.1 移除 `components/layout/topbar.tsx` 中的「新增課程」Button、CourseOrderDialog 元件引用及相關 `isOrderOpen` state
- [x] 2.2 在 `<header>` 加上 `sticky top-0 z-50 bg-background` class，使 Topbar 固定於頁面頂部

## 3. 更新首頁課程區塊（/user/[spiritId]）

- [x] 3.1 在 `app/(user)/user/[spiritId]/page.tsx` 移除 `pendingCourses`、`activeCourses`、`completedCourses` 三組分類邏輯，改為單一 `enrollments`（過濾 `cancelledAt` 不為 null 的項目）
- [x] 3.2 將課程區塊的三個子分組 JSX 替換為單一 `<CourseCardGrid>` 包裹的課程卡片列表，保留空狀態提示
- [x] 3.3 確認每張卡片傳入 `startedAt`、`cancelledAt`、`completedAt` 以正確顯示狀態徽章

## 4. 更新我的開課頁面（/user/[spiritId]/courses）

- [x] 4.1 在 `app/(user)/user/[spiritId]/courses/page.tsx` 將現有 grid div 替換為 `<CourseCardGrid>`
- [x] 4.2 確認 `getMyCourseSessions` 回傳的 `startedAt`、`cancelledAt`、`completedAt` 欄位已傳入 `CourseSessionCard`

## 5. 版本與文件更新

- [x] 5.1 更新 `config/version.json` patch 版本號 +1
- [x] 5.2 依 `.ai-rules.md` 規範更新 `README-AI.md`
