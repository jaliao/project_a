## Why

首頁課程單元三分組增加認知負擔且格局過小；`/user/[spiritId]/courses` 頁的卡片缺少課程狀態顯示；Topbar 多餘按鈕佔用空間，且在 `/course/[id]` 頁面無法點擊個人資料與訊息中心按鈕。此批次修正提升學員與講師的日常操作體驗。

## What Changes

- 首頁課程單元取消「申請中 / 已開課 / 已結業」三分組，改為單一平鋪列表
- 首頁課程卡片網格與 `/user/[spiritId]/courses` 統一使用共用 `CourseCardGrid` 元件，RWD 規則：1 col → sm: 2 col → lg: 3 col → xl: 4 col
- `/user/[spiritId]/courses`（我的開課）課程卡片補傳 `startedAt`、`cancelledAt`、`completedAt`，使狀態徽章（招生中 / 進行中 / 已結業 / 已取消）正常顯示
- Topbar 移除「新增課程」按鈕（`CourseOrderDialog` 入口改由其他頁面提供）
- 修復 `/course/[id]` 頁面 Topbar「個人資料」與「訊息中心」按鈕無法點擊的問題

## Capabilities

### New Capabilities
- `course-card-grid`：可共用的課程卡片響應式網格布局元件（`components/course-session/course-card-grid.tsx`），統一管理 RWD 欄數規則

### Modified Capabilities
- `dashboard-home`：首頁課程區塊改為無分組平鋪，使用 `CourseCardGrid`
- `topbar`：移除新增課程按鈕；修復 `/course/[id]` 頁面按鈕可點擊性問題

## Impact

- `components/layout/topbar.tsx` — 移除 CourseOrderDialog 相關程式碼
- `app/(user)/user/[spiritId]/page.tsx` — 課程區塊改為單一列表 + CourseCardGrid
- `app/(user)/user/[spiritId]/courses/page.tsx` — 使用 CourseCardGrid，補傳狀態欄位
- `components/course-session/course-session-card.tsx`（只讀）— 確認 status props 正確顯示
- 新增 `components/course-session/course-card-grid.tsx`
- 需調查 `/course/[id]` 頁面 Topbar 點擊問題（可能為 z-index 或 overflow 遮蔽）
