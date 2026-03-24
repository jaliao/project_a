## 1. 資料層

- [x] 1.1 新增 `lib/data/course-sessions.ts`，實作 `getMyCourseSessions(userId, limit?)` 查詢 CourseInvite（include `_count.enrollments` 與 `courseOrder.courseDate`，依 createdAt 降冪）

## 2. 共用元件

- [x] 2.1 新增 `components/course-session/course-session-card.tsx`，接受 props（title, courseLevel, courseDate, maxCount, enrolledCount, expiredAt, variant）
- [x] 2.2 CourseSessionCard 顯示課程名稱、等級標籤、已報名/預計人數、開課日期（有值才顯示）、截止日期（有值才顯示）
- [x] 2.3 CourseSessionCard 支援 compact / full variant 樣式差異

## 3. 開課查詢頁

- [x] 3.1 新增 `app/(user)/course-sessions/page.tsx`，Server Component，讀取 session 後呼叫 `getMyCourseSessions`
- [x] 3.2 頁面顯示標題「開課查詢」與「← 返回首頁」連結（導向 `/dashboard`）
- [x] 3.3 有記錄時以 CourseSessionCard（variant="full"）列表呈現，無記錄時顯示空狀態提示「尚無開課記錄」

## 4. Dashboard 整合

- [x] 4.1 `dashboard/page.tsx` 呼叫 `getMyCourseSessions(userId, 5)` 取得最近 5 筆
- [x] 4.2 有開課記錄時，在授課功能卡片上方新增「已新增的開課」區塊，以 CourseSessionCard（variant="compact"）呈現
- [x] 4.3 超過 5 筆時，區塊底部顯示「查看全部」連結（導向 `/course-sessions`）
- [x] 4.4 將授課區塊中「開課查詢」disabled button 改為 `<Link href="/course-sessions">` 並套用正常樣式

## 5. 版本與文件

- [x] 5.1 更新 `config/version.json` patch 版本號 +1
- [x] 5.2 更新 `README-AI.md`
