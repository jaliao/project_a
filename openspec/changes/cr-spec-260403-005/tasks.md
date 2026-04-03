## 1. Data Layer

- [x] 1.1 新增 `lib/data/dashboard.ts`：實作 `getDashboardStats()` 回傳 `{ totalMembers, spiritInstructors, richInstructors, activeCourseSessions }`
- [x] 1.2 `lib/data/dashboard.ts`：實作 `getCourseStartStats(days: number)` — 查 CourseInvite.startedAt >= now-days，以 courseCatalogId 分組，join catalog label，回傳 `{ catalogId, label, count }[]`
- [x] 1.3 `lib/data/dashboard.ts`：實作 `getGraduationStats(days: number)` — 查 InviteEnrollment.graduatedAt >= now-days，以 courseCatalogId 分組，join catalog label，回傳 `{ catalogId, label, count }[]`

## 2. Dashboard Charts Client Component

- [x] 2.1 新增 `app/(user)/admin/dashboard/dashboard-charts.tsx`（Client Component）：接收 `startStats`、`graduationStats`、`range` props；渲染時間區間切換按鈕（3個月 / 30天 / 7天，router.push `?range=`）；渲染兩個 recharts BarChart（開始上課 / 順利結業），X 軸為 catalog label，Y 軸為數量

## 3. Dashboard Page

- [x] 3.1 新增 `app/(user)/admin/dashboard/page.tsx`（Server Component）：auth check（admin+）；讀 `searchParams.range`（預設 `30d`）；計算 days（3m=90, 30d=30, 7d=7）；並行 fetch `getDashboardStats()` + `getCourseStartStats()` + `getGraduationStats()`
- [x] 3.2 `app/(user)/admin/dashboard/page.tsx`：渲染 4 個統計卡片（總學員數 / 啟動靈人資格講師數 / 啟動豐盛資格講師數 / 進行中課程總數）
- [x] 3.3 `app/(user)/admin/dashboard/page.tsx`：渲染 `<DashboardCharts>` 並傳入 startStats / graduationStats / range

## 4. 後台首頁更新

- [x] 4.1 `app/(user)/admin/page.tsx`：「儀錶板」卡片 `href` 改為 `/admin/dashboard`，移除 `badge: '待開發'` 與 `href: null` 佔位

## 5. 版本與文件

- [x] 5.1 `config/version.json` patch 版本號 +1
- [x] 5.2 依 `.ai-rules.md` 更新 `README-AI.md`
