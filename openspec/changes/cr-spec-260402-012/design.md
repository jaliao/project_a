## Context

目前教材申請表單要求講師手動填寫 8 個欄位（姓名中英文、Email、電話、教師姓名、所屬教會、開課日期、取貨方式），但這些資料大多已存在系統中。此 CR 將表單精簡為僅 2 個真正需要使用者判斷的欄位，其餘由 Server Action 在提交時自動從 User / CourseInvite 快照。後台管理者可在 `/admin/materials` 編輯快照欄位以便修正。

## Goals / Non-Goals

**Goals:**
- 申請表單只顯示「統一編號（選填）」和「取貨方式 / 地址」
- 提交時 Server Action 自動帶入 buyerNameZh/En、teacherName、churchOrg、email、phone、courseDate
- 無需 DB migration（欄位不改 nullable）
- 後台新增「編輯申請資料」功能，管理者可修改任何快照欄位

**Non-Goals:**
- 不改動 `CourseOrder` 的 DB schema
- 不改動出貨單列印頁（繼續顯示所有欄位）
- 不改動 `createCourseOrder`（訂購流程，非申請教材流程）

## Decisions

### 快照欄位的來源映射

| CourseOrder 欄位 | 來源 |
|---|---|
| `buyerNameZh` | `user.realName \|\| user.name \|\| '（未填）'` |
| `buyerNameEn` | `user.englishName \|\| ''` |
| `email` | `user.commEmail \|\| user.email` |
| `phone` | `user.phone \|\| ''` |
| `churchOrg` | `church.name` / `user.churchOther` / `''`（依 churchType） |
| `teacherName` | `invite.createdBy.realName \|\| invite.createdBy.name \|\| ''` |
| `courseDate` | `invite.courseDate \|\| '無'` |

所有快照欄位若來源為空，填入空字串（DB 不允許 null）。

### 表單 Zod Schema 精簡

移除 `materialOrderSchema` 中所有快照欄位的驗證。保留：
- `taxId`（optional string）
- `deliveryMethod`（enum required）
- `deliveryAddress`（conditional required）
- `storeId` / `storeName`（conditional required for CVS）

### 後台編輯 Action

新增 `updateMaterialOrderAdmin(orderId, data)` Server Action，限 admin/superadmin，可修改所有快照欄位 + taxId。Zod schema 單獨定義（`adminMaterialOrderEditSchema`）。

### UI 改動最小化

- `MaterialOrderDialog` 只移除購買人資料區塊與開課日期欄位，取貨方式區塊不動
- 後台 `material-order-table.tsx` 的展開詳情區塊新增顯示快照欄位，並加「編輯」按鈕
- 後台新增 `MaterialOrderEditDialog`（Client Component）

## Risks / Trade-offs

- **會員資料不完整時快照為空字串** → 管理者可透過編輯功能補填，出貨單仍可正確列印
- **courseDate 來源** → `CourseInvite.courseDate` 為選填字串，可能為 null；fallback 為 `'無'`，與舊行為一致

## Migration Plan

無 DB migration。部署順序：
1. 更新 Zod schema（向後相容，後端仍接受舊欄位但不再必填）
2. 更新 Server Action（補充快照邏輯）
3. 更新前端表單（移除欄位）
4. 新增後台編輯功能

rollback：還原上述四個檔案即可。
