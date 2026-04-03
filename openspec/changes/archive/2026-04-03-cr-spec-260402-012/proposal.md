## Why

教材申請表單要求學員填入大量個人資料（姓名、Email、電話、教師名稱、所屬教會、開課日期），但這些資料系統中已有，造成重複填寫與出錯。精簡表單降低申請門檻，由後台從會員資料自動帶入，管理者可在後台確認與修改。

## What Changes

- 學員申請教材時，表單僅需填寫「統一編號（選填）」與「取貨方式/地址」兩個欄位
- 其他欄位（buyerNameZh、buyerNameEn、teacherName、churchOrg、email、phone、courseDate）在 Server Action 提交時自動從會員與課程資料帶入，**快照式儲存**（記錄申請當下的資料，不隨會員資料異動）
- `CourseOrder` DB 欄位維持 NOT NULL，Server Action 負責在儲存前組合出完整資料
- 後台 `/admin/materials` 管理頁新增「編輯」功能，管理者可查看並修改每筆申請的快照欄位
- 出貨單列印頁維持顯示所有欄位（無論來源）

## Capabilities

### New Capabilities
- `material-order-simplified-form`: 學員申請表單精簡為僅統一編號 + 取貨方式；提交時 Server Action 自動從 User/CourseInvite 帶入其他欄位

### Modified Capabilities
- `admin-material-management`: 後台管理頁新增「編輯」按鈕，開啟 Dialog 讓管理者修改申請的所有欄位（buyerNameZh/En、teacherName、churchOrg、email、phone、courseDate）

## Impact

- `lib/schemas/course-order.ts` — `materialOrderSchema` 移除 buyerNameZh/En/teacherName/churchOrg/email/phone/courseDate 必填欄位
- `components/course-session/material-order-dialog.tsx` — 移除購買人資料區塊與開課日期欄位
- `app/actions/course-order.ts` `applyMaterialOrder` — 從 session 取得 userId，查詢 User + CourseInvite 自動帶入欄位
- `prisma/schema/course-order.prisma` — 無需異動（欄位維持 NOT NULL，資料由 Server Action 填入）
- `app/(user)/admin/materials/` — 新增編輯 Dialog（管理者補填/修改申請資料）
- `components/admin/material-order-table.tsx` — 新增「編輯」按鈕，展開詳情區塊顯示自動帶入的欄位值
