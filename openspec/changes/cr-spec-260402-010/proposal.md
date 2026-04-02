## Why

目前會員資料缺少所屬教會/單位欄位，無法追蹤學員來源。建立集中管理的教會清單，並讓會員在個人資料維護時選擇，可支援後續統計與分群需求。

## What Changes

- 新增 `Church` 資料模型（id、name、isActive、sortOrder）
- 後台新增 `/admin/churches` CRUD 管理頁（新增、編輯、啟用/停用）
- `prisma/seed.ts` 新增四個預設教會：101、心欣、Kua、全福會
- `User` 新增三個欄位：`churchId`（外鍵關聯 Church，可空）、`churchOther`（自填文字，可空）、`churchType`（enum：`church` | `other` | `none`）
- 個人資料維護頁（`/profile`）新增「所屬教會/單位」欄位：
  - 預設顯示 Church 清單下拉選單
  - 可選「其他」→ 顯示文字輸入框（儲存至 `churchOther`）
  - 可選「無」→ 清空關聯

## Capabilities

### New Capabilities
- `church-management`: 後台 Church CRUD 管理（名稱、啟用狀態、排序）
- `member-church-profile`: 會員個人資料新增所屬教會/單位欄位（從清單選擇、其他自填、或無）

### Modified Capabilities
- `admin-member-management`: 會員詳情頁「基本資料」區塊補顯示所屬教會/單位
- `admin-seed`: seed.ts 新增四個預設教會資料

## Impact

- `prisma/schema/` — 新增 `church.prisma`，`user.prisma` 新增 `churchId`、`churchOther`、`churchType` 欄位
- `lib/data/churches.ts` — 新增 CRUD data layer
- `app/(user)/admin/churches/` — 新增管理頁
- `app/actions/church.ts` — 新增 Server Actions（create/update/toggleActive）
- `app/(user)/profile/page.tsx` — 新增所屬教會欄位
- `app/(user)/admin/members/[id]/page.tsx` — 補顯示所屬教會
- `prisma/seed.ts` — 新增 Church 初始資料
