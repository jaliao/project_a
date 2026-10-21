## Why

後台儀表板「講師分析」目前僅統計各身分講師（啟動／豐盛／得勝）的總人數，無法看出這些講師是否已實際開課，管理者無法掌握講師的開課覆蓋率。

## What Changes

- 「講師分析」三張講師身分卡片（啟動講師／豐盛講師／得勝講師）新增「已開課」人數，與現有總人數對照呈現
- 「已開課」定義：該講師身分使用者中，有建立過至少一筆 `CourseInvite`（即 `CourseInvite.createdById` 為該使用者）者
- 不新增獨立卡片／圖表，沿用既有三張 StatCard 版面，於卡片內補充已開課人數

## Capabilities

### New Capabilities

（無）

### Modified Capabilities

- `admin-dashboard`: 「講師分析」統計卡片新增「已開課講師人數」欄位（依講師身分分類），與既有總人數對照顯示

## Impact

- `lib/data/dashboard.ts`：`getDashboardStats()` 需新增依講師身分分組的「已開課人數」查詢（依 `CourseInvite.createdById` 是否存在對應記錄）
- `app/[locale]/(admin)/admin/dashboard/page.tsx`：講師分析三張 StatCard 需呈現「已開課／總人數」
- 無資料庫 schema 變更，無 migration
