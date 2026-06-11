## Why

現有後台儀錶板（`/admin/dashboard`）的統計卡片有兩個問題：「啟動靈人／豐盛資格講師數」僅以「結業該課程」認定，未檢查 `teacher` 身分，導致數字無法反映真正具備講師資格的人數；同時缺少「招生中」與「已結業」課程的總覽，管理者難以一眼掌握各課程狀態分佈。

## What Changes

- 統計卡片由 **4 張擴充為 6 張**，並調整卡片網格 RWD 佈局以容納 6 張。
- 卡片「總學員數」更名為 **「總會員數」**（語意校正，計數來源不變＝所有 User）。
- **重新定義**「啟動靈人講師資格人數」：須**同時**具備 `teacher` 身分 **AND** 已結業啟動靈人（CourseCatalog id=1），去重計數。
- **重新定義**「啟動豐盛講師資格人數」：須**同時**具備 `teacher` 身分 **AND** 已結業啟動豐盛（CourseCatalog id=2），去重計數。
  - 註：僅 `admin`／`superadmin` 而未加掛 `teacher` 者**不計入**。
- **新增**「開課中課程總數」：招生中課程（`startedAt IS NULL AND cancelledAt IS NULL AND completedAt IS NULL`）。
- 保留「進行中課程總數」：`startedAt IS NOT NULL AND cancelledAt IS NULL AND completedAt IS NULL`。
- **新增**「已結業課程總數」：`completedAt IS NOT NULL`。
- **移除**原有的「課程活動統計」圖表區塊：上課人次 BarChart、順利結業 BarChart、時間區間切換（`?range=`），儀錶板僅保留統計卡片。

## Capabilities

### New Capabilities
<!-- 無新增能力 -->

### Modified Capabilities
- `admin-dashboard`：修改「統計數據卡片」需求——卡片由 4 張改為 6 張；「總學員數」更名為「總會員數」；講師資格人數新增 `teacher` 身分條件（身分 AND 結業）；新增「開課中課程總數」與「已結業課程總數」兩項統計。並**移除**「上課人次趨勢圖表」「順利結業趨勢圖表」「時間區間切換」三項需求。

## Impact

- **資料層** `lib/data/dashboard.ts`：`DashboardStats` 型別新增 `recruitingCourseSessions`、`completedCourseSessions` 欄位；`getDashboardStats()` 的講師查詢加上 `teacher` 身分過濾（`user.roles has teacher`），並新增招生中／已結業課程計數。
- **頁面** `app/(user)/admin/dashboard/page.tsx`：渲染 6 張卡片、調整 grid（如 `grid-cols-2 lg:grid-cols-3`）、更新卡片文案；移除圖表區塊、時間區間切換與 `?range=` searchParams 處理。
- **資料層** `lib/data/dashboard.ts`：移除 `getCourseStartStats()`、`getGraduationStats()` 與 `CourseStatItem` 型別（已無使用者）。
- **元件** `app/(user)/admin/dashboard/dashboard-charts.tsx`：刪除（不再使用）。
- **無** DB schema 變更（沿用既有 `User.roles`、`CourseInvite`、`InviteEnrollment`、`CourseCatalog`）。
- 依專案規範：完成後須 `config/version.json` patch +1、重產 `README-AI.md`，並同步更新 `doc/管理者操作手冊.md`〈後台儀錶板〉章節。
