# Proposal: cr-spec-260714-007 後台學員頁面優化（基本資料顯示年齡＋學習/授課紀錄卡片化）

## Why

後台會員詳情頁的基本資料看不到年齡（`User.birthYear` 已存在但未呈現），管理者需自行換算；學習紀錄與授課紀錄目前以自製表格呈現，欄位少（僅名稱/目錄/開課日）、與全站其他頁面的課程呈現不一致，也缺少點擊進入課程頁的入口。

## What Changes

- **基本資料分頁顯示年齡**：於基本資料區塊新增「年齡」欄位，依 `User.birthYear` 以當年西元年計算（`當年 − birthYear` 歲）；`birthYear` 未填時顯示 `—`。
- **學習紀錄卡片化**：基本資料分頁的「學習紀錄」由表格改為共用 `CourseSessionCard` 元件的卡片牆呈現（含課程編號、標籤列、狀態、人數、開課日等標準資訊），卡片連結至對應課程頁。
- **授課紀錄卡片化**：同上，「授課紀錄」亦改為 `CourseSessionCard` 卡片牆呈現。
- **資料層擴充**：`getMemberDetail`（`lib/data/members.ts`）select 補齊卡片所需欄位——`birthYear`，以及學習/授課紀錄之 invite 的 `courseDate`、`maxCount`、`expiredAt`、`cancelledAt`、`completedAt`、報名人數（`_count`）。
- 無資料時維持「尚無學習紀錄／尚無授課紀錄」空狀態文案。

不改動 `CourseSessionCard` 元件本身（既有 props 已足夠）。

## Capabilities

### New Capabilities

（無）

### Modified Capabilities

- `admin-member-management`：「會員詳情頁」需求變更——基本資料分頁新增年齡欄位（依 `birthYear` 計算、未填顯示 `—`）；學習紀錄與授課紀錄改以共用課程卡片元件（`CourseSessionCard`）呈現並可點擊連至課程頁，取代原表格。

## Impact

- **頁面**：`app/[locale]/(admin)/admin/members/[id]/page.tsx`（基本資料分頁：年齡欄位＋兩區塊改卡片牆）
- **資料層**：`lib/data/members.ts` `getMemberDetail`（擴充 select 欄位與 `_count`）
- **共用元件**：`components/course-session/course-session-card.tsx`（僅引用，不修改）
- **文件**：`doc/管理者操作手冊.md`（會員詳情頁章節）、`config/version.json` patch +1、`README-AI.md`（依 apply 規範）
- 無 schema/migration、無 API 變更、無破壞性變更
