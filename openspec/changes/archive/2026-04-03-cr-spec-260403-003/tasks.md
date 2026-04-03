## 1. Data Layer

- [x] 1.1 `lib/data/course-sessions.ts`：新增 `AdminCourseSessionParams` 型別（q, catalogId, status, startDate, endDate）
- [x] 1.2 `lib/data/course-sessions.ts`：新增 `getAllCourseSessionsAdmin(params)` 查詢，回傳 `{ total: number, items: CourseSessionItem[] }`，take: 30，orderBy: courseDate desc nulls last，支援全部篩選條件

## 2. CourseSessionCard 支援另開視窗

- [x] 2.1 `components/course-session/course-session-card.tsx`：新增可選 prop `newTab?: boolean`，當 `newTab=true` 時以 `<a target="_blank" rel="noopener noreferrer">` 替代 `<Link>`

## 3. 後台開課管理頁

- [x] 3.1 新增 `app/(user)/admin/course-sessions/course-sessions-filter.tsx`（Client Component）：搜尋框（?q=）、課程名稱下拉（?catalogId=）、進度下拉（?status=）、開課日期區間（?startDate=/?endDate=），任一變更即 router.push 更新 URL
- [x] 3.2 新增 `app/(user)/admin/course-sessions/page.tsx`（Server Component）：auth check（admin+）、讀 searchParams 傳給 getAllCourseSessionsAdmin、顯示總筆數、渲染 CourseSessionsFilter + 開課卡片列表（newTab=true）
- [x] 3.3 `app/(user)/admin/course-sessions/page.tsx`：超過 30 筆時在列表下方顯示提示文字；無結果時顯示空白提示

## 4. 後台首頁入口更新

- [x] 4.1 `app/(user)/admin/page.tsx`：「授課管理」功能卡片 `href` 改為 `/admin/course-sessions`，`superadminOnly` 維持 false

## 5. 版本與文件

- [x] 5.1 `config/version.json` patch 版本號 +1
- [x] 5.2 依 `.ai-rules.md` 更新 `README-AI.md`
