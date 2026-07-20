# Proposal: cr-spec-260720-002 後台會員詳情顯示招生中課程

## Why

後台會員詳情頁（`/admin/members/[id]`）的學習紀錄與授課紀錄僅顯示「已開課」課程（`startedAt IS NOT NULL`，cr-260714-007 定義）：學員已報名／老師已開設但仍在**招生中**的課程完全看不到，管理者無法從會員頁掌握進行中的招生狀況（例如協助處理報名、教材）。

## What Changes

- **學習紀錄**：改為顯示該會員**所有已核准報名**的課程（含招生中；不再以 `startedAt` 過濾），課程卡片既有狀態標籤（招生中／進行中／已結業／已取消）自然區分狀態。
- **授課紀錄**：改為顯示該會員**建立的所有**課程（含招生中與已取消）。
- **排序**：招生中課程排最前，其後依開課時間新→舊。
- 空狀態文案不變（無任何紀錄才顯示「尚無學習／授課紀錄」）。

## Capabilities

### New Capabilities

（無）

### Modified Capabilities

- `admin-member-management`：「會員詳情頁」requirement 之學習紀錄／授課紀錄範圍由「已開課」放寬為「全部（含招生中）」，並定義排序。

## Impact

- **資料層**：`lib/data/members.ts`（`getMemberDetail` 移除兩處 `startedAt` 過濾、調整排序）
- **UI**：`app/[locale]/(admin)/admin/members/[id]/page.tsx`（卡片已支援各狀態，預期僅需極小調整或不需調整）
- **文件**：`doc/管理者操作手冊.md` 描述同步；`config/version.json` patch +1
- **無 migration**
