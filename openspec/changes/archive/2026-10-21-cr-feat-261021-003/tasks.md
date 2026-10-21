## 1. Data Layer

- [x] 1.1 於 `lib/data/dashboard.ts` 的 `DashboardStats` 型別新增 `spiritInstructorsActive` / `richInstructorsActive` / `victoryInstructorsActive` 三個欄位
- [x] 1.2 於 `getDashboardStats()` 的 `Promise.all` 中新增三筆查詢：`prisma.user.count({ where: { roles: { has: 'teacher_X' }, courseInvites: { some: {} } } })`（X = 1/2/3），並將結果併入回傳物件

## 2. 畫面呈現

- [x] 2.1 擴充 `app/[locale]/(admin)/admin/dashboard/page.tsx` 的 `StatCard`，新增可選的「已開課」子數值顯示（例如卡片內補一行「已開課 {active}／{value}」）
- [x] 2.2 講師分析區塊三張 `StatCard`（啟動／豐盛／得勝講師）傳入對應的已開課人數

## 3. 驗證

- [x] 3.1 本機以 `make prisma-dev-seed` 或既有測試資料驗證：有建立過課程的講師與未建立過課程的講師，已開課人數與總人數對照正確
- [x] 3.2 `npm run lint` 與 `npm run build` 通過
