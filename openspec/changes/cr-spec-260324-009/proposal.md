## Why

Dashboard 目前「授課」區塊只有「新增開課」按鈕，教師無法快速瀏覽已建立的開課狀況；「開課查詢」按鈕也尚未啟用。需補全開課可見性，讓教師在首頁即能掌握課程進度。

## What Changes

- Dashboard「授課」區塊上方新增「開課卡片列表」，以卡片呈現當前教師已建立的開課（最近 N 筆），包含課程名稱、課程內容、開課日期、已接受人數／預計人數，點擊可查看完整開課詳情
- 啟用「開課查詢」按鈕，導向新路由 `/course-sessions`，顯示全部開課記錄（含已結束），同樣使用卡片呈現
- 新增共用元件 `CourseSessionCard`，供 Dashboard 與開課查詢頁共用

## Capabilities

### New Capabilities
- `course-session-card`: 共用課程卡片元件，顯示課程名稱、內容、日期、人數比例，可選擇性渲染詳情連結
- `course-sessions-list`: `/course-sessions` 路由，列出使用者所有開課記錄（含已結束），使用 `CourseSessionCard` 卡片呈現
- `dashboard-course-preview`: Dashboard 授課區塊上方顯示最近開課卡片清單，點擊連結至 `/course-sessions` 的對應記錄

### Modified Capabilities
- `dashboard-home`: 授課功能區塊上方插入開課卡片列表；啟用「開課查詢」按鈕（改為 Link，導向 `/course-sessions`）
- `create-course-session`: 無 spec 需求異動，僅實作細節調整（建立成功後重新整理開課列表）

## Impact

- 新增路由：`app/(user)/course-sessions/page.tsx`
- 新增共用元件：`components/course-session/course-session-card.tsx`
- 新增資料函式：`lib/data/course-sessions.ts`（查詢 CourseInvite + 關聯 CourseOrder）
- 修改：`app/(user)/dashboard/page.tsx`（加入開課預覽、啟用開課查詢連結）
- 資料來源：`CourseInvite`（title、maxCount、enrollmentCount、expiredAt、courseLevel）+ 關聯 `CourseOrder`（courseDate）
