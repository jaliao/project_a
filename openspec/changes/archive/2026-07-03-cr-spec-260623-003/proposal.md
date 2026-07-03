# cr-spec-260623-003：後台儀錶板優化——分區塊統計

## Why

後台儀錶板目前僅 7 張統計卡片平鋪一個 grid，無分類、缺少活躍度／教會分布／已放棄課程等營運指標；「開課中」用語與實際意義（尚在招募學員）不符。分區塊呈現並補齊指標，讓管理者一眼掌握學員、講師、課程三個面向。

## What Changes

- 儀錶板統計改為**三個區塊**呈現：
  - **學員分析**（包含講師）：
    - 學員總數（全體 User）
    - 各教會的會員總數（依 `Church` 清單逐教會計數；含「其他（自填）」與「未填」歸類）
    - 近期活躍學員數（7 天內，依 `lastLoginAt`）
  - **講師分析**：
    - 啟動講師（`teacher_1`）
    - 豐盛講師（`teacher_2`）
    - 得勝講師（`teacher_3`）
  - **課程分析**：
    - 招募中課程總數（原「開課中」，未開始／未取消／未結業）
    - 進行中課程總數
    - 已結業課程總數
    - **已放棄課程總數**（新增，`cancelledAt` 非空）
- 卡片標籤「開課中課程總數」改為**「招募中課程總數」**；講師卡標籤簡化為「啟動講師／豐盛講師／得勝講師」。
- `lib/data/dashboard.ts` 擴充查詢：新增各教會分布、近期活躍數、已放棄課程數。
- 後台頁面維持繁體（依 i18n 規範後台不走 messages）。
- 同步更新 `doc/管理者操作手冊.md` 儀錶板章節與版號。

## Capabilities

### New Capabilities

（無）

### Modified Capabilities

- `admin-dashboard`：既有需求「統計數據卡片」改寫——由六卡平鋪改為「學員分析／講師分析／課程分析」三區塊，新增各教會會員數、近期活躍學員數（7 天）、已放棄課程總數，並將「開課中」更名「招募中」。

## Impact

- **Data Layer**：`lib/data/dashboard.ts`（`DashboardStats` 型別與查詢擴充：`groupBy` church、`lastLoginAt` 七天窗、`cancelledAt` 計數）。
- **UI**：`app/[locale]/(admin)/admin/dashboard/page.tsx`（三區塊版面、卡片標籤更名）。
- **資料模型**：無 schema 變更（沿用 `User.churchType/churchId/churchOther`、`lastLoginAt`、`CourseInvite.cancelledAt`）。
- **文件**：`doc/管理者操作手冊.md` 儀錶板統計說明；`config/version.json` patch +1、`README-AI.md`（apply 階段）。
- **不影響**：功能卡（動態待辦副標題）需求不變；他處「招生中」用語（課程清單篩選、`status.recruiting`）不在本次範圍。
