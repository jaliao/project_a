## Why

管理員目前無法可視化地了解學員之間的「師生傳承關係」——誰帶領了誰完成啟動靈人課程。建立這個階層視圖可讓後台人員快速了解靈人網絡的深度與廣度，輔助輔導與追蹤工作。

## What Changes

- 新增 `MemberHierarchyTree` 伺服器元件，以樹狀結構顯示指定會員的師生關係（向上一層老師，向下 N 層學生）
- 新增 admin 全域設定（`AdminSetting` 表）儲存 `hierarchy_depth`，預設值為 3
- 新增後台設定頁 `/admin/settings`，允許 superadmin 調整 `hierarchy_depth`
- 將 `MemberHierarchyTree` 以 shadcn Tabs 方式整合進會員詳情頁 (`/admin/members/[id]`)，與現有「基本資料」並列

## Capabilities

### New Capabilities
- `member-learning-hierarchy`: 在會員詳情頁顯示師生傳承樹（向上 1 層老師、向下 N 層學生），N 由 admin 設定控制
- `admin-settings`: 後台全域設定管理，初期支援 `hierarchy_depth` 鍵值，superadmin 可讀寫

### Modified Capabilities
- `admin-member-management`: 會員詳情頁新增「學習階層」分頁（tabs），現有顯示邏輯不變

## Impact

- `prisma/schema/` — 新增 `AdminSetting` 模型（key/value store）
- `lib/data/members.ts` — 新增遞迴/迭代式階層查詢函式
- `lib/data/admin-settings.ts` — 新增讀寫 admin settings 的 data layer
- `app/(user)/admin/members/[id]/page.tsx` — 改用 Tabs，加入「學習階層」分頁
- `app/(user)/admin/settings/page.tsx` — 新增設定頁
- `components/admin/member-hierarchy-tree.tsx` — 新增樹狀元件
- `app/actions/admin-settings.ts` — 新增 Server Action 更新設定值
- 需執行 `make schema-update` 建立 AdminSetting 遷移
