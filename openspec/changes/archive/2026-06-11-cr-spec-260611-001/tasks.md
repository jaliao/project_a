## 1. 資料層調整（lib/data/dashboard.ts）

- [x] 1.1 更新 `DashboardStats` 型別：新增 `recruitingCourseSessions`、`completedCourseSessions`；保留 `totalMembers`、`spiritInstructors`、`richInstructors`、`activeCourseSessions`
- [x] 1.2 `getDashboardStats()` 講師資格查詢改為「`teacher` 身分 AND 結業」：以 `prisma.user.count({ where: { roles: { has: 'teacher' }, inviteEnrollments: { some: { graduatedAt: { not: null }, invite: { courseCatalogId: N } } } } })`，N=1（靈人）、N=2（豐盛）
- [x] 1.3 新增開課中（招生中）計數：`startedAt: null, cancelledAt: null, completedAt: null`
- [x] 1.4 新增已結業計數：`completedAt: { not: null }`
- [x] 1.5 移除 `getCourseStartStats()`、`getGraduationStats()` 與 `CourseStatItem` 型別

## 2. 頁面調整（app/(user)/admin/dashboard/page.tsx）

- [x] 2.1 「總學員數」卡片文案改為「總會員數」
- [x] 2.2 「啟動靈人/豐盛資格講師數」文案改為「啟動靈人/豐盛講師資格人數」
- [x] 2.3 新增「開課中課程總數」「已結業課程總數」兩張卡片，共 6 張
- [x] 2.4 卡片網格調整為 `grid-cols-2 lg:grid-cols-3`
- [x] 2.5 移除圖表區塊、`DashboardCharts` 引用、`?range=` searchParams 處理與 `Range`/`RANGE_DAYS`/`RANGE_LABELS` 常數
- [x] 2.6 移除對 `getCourseStartStats`/`getGraduationStats` 的呼叫

## 3. 清理

- [x] 3.1 刪除 `app/(user)/admin/dashboard/dashboard-charts.tsx`
- [x] 3.2 確認無其他檔案引用已移除的函式 / 元件（grep `getCourseStartStats`、`getGraduationStats`、`dashboard-charts`、`CourseStatItem`）

## 4. 驗證

- [ ] 4.1 `npm run lint` 通過 —⚠️ 既有環境問題：專案缺 eslint v9 設定檔（`eslint.config.js`），與本變更無關，無法執行
- [x] 4.2 `npm run build` 通過（✓ Compiled successfully，`/admin/dashboard` 正常編譯）
- [ ] 4.3 以 admin 登入 `/admin/dashboard` 確認顯示 6 張卡片、數值正確、無圖表、一般使用者被 redirect —需在執行中的環境手動驗證

## 5. 規範同步（依 CLAUDE.md）

- [x] 5.1 `config/version.json` patch +1
- [x] 5.2 重新產生 `README-AI.md`
- [x] 5.3 更新 `doc/管理者操作手冊.md`〈後台儀錶板〉章節（6 張卡片、講師資格定義、移除圖表）
