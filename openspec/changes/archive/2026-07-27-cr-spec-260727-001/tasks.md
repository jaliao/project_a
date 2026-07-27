## 1. Schema 變更

- [x] 1.1 `prisma/schema/support-inquiry.prisma`：`userId` 改為 `String? @db.Uuid`，`user` 關聯 `onDelete` 改為 `SetNull`
- [x] 1.2 `prisma/schema/support-inquiry.prisma`：新增快照欄位 `submitterName String`、`submitterSpiritId String?`、`submitterRealName String?`、`submitterGenderLabel String`、`submitterChurchLabel String`（皆給預設值或 nullable，相容既有 18 筆資料）
- [x] 1.3 `prisma/schema/admin-log.prisma`：`inviteTitle` 改為 `String?`
- [x] 1.4 `make schema-update name=support-inquiry-retain-on-delete`，確認 migration 產生成功且不需回填既有資料

## 2. 提問建立時寫入快照

- [x] 2.1 `app/actions/support-inquiry.ts`（`submitInquiry`）：查詢當下使用者的 `spiritId`／`realName`／`englishName`／`nickname`／`displayNameMode`／`gender`／`churchType`／`churchOther`／`church.name`，並於 `prisma.supportInquiry.create()` 一併寫入 `submitterName`（`getMemberDisplayName()`）、`submitterSpiritId`、`submitterRealName`、`submitterGenderLabel`（`genderLabel()`）、`submitterChurchLabel`（`churchLabel()`）
- [x] 2.2（build 發現的額外必要修正）`app/actions/support-inquiry.ts`（`replyInquiry`）：`inquiry.userId` 現為可選，回覆通知僅在 `userId` 存在時發送，避免提問人帳號已刪除時通知呼叫失敗

## 3. 後台資料層改用快照 + 判斷帳號刪除狀態

- [x] 3.1 `lib/data/support-inquiry.ts`（`getInquiryList`）：`user` 關聯改為可選 join（`userId` 可能為 `null`）；`user` 為 `null` 時改用該筆快照欄位算出 `submitterName`／`submitterSpiritId`／`submitterRealName`／`submitterGenderLabel`／`submitterChurchLabel`
- [x] 3.2 `lib/data/support-inquiry.ts`：`InquiryListItem` 新增 `isSubmitterDeleted: boolean` 欄位（`userId === null` 時為 `true`）

## 4. 後台 UI 呈現

- [x] 4.1 `components/admin/support-inquiry-card.tsx`：`isSubmitterDeleted` 為 `true` 時於提問人資訊旁顯示「此帳號已被刪除」提示
- [x] 4.2 `components/admin/support-inquiry-card.tsx`：`isSubmitterDeleted` 為 `true` 時不渲染「查看會員」連結（課程關聯之「查看課程」連結不受影響，維持原邏輯）

## 5. 會員刪除稽核紀錄

- [x] 5.1 `app/actions/admin.ts`（`deleteMember`）：改用 `prisma.$transaction()` 包住既有刪除步驟（`inviteEnrollment.deleteMany`／`courseInvite.deleteMany`／`user.delete`）
- [x] 5.2 `deleteMember`：刪除前於同一交易內查出被刪除會員的顯示名稱與 email，寫入 `AdminActionLog`（`action: 'member_delete'`、`actorId`＝當前管理者、`actorName`、`targetName`＝被刪除帳號顯示名稱＋email、`targetUserId`／`inviteId`／`inviteTitle` 皆留空）

## 6. 驗證

- [x] 6.1 `npm run lint`、`npm run build` 確認無型別／編譯錯誤（過程中額外發現並修正 `lib/data/admin-logs.ts` 的 `AdminLogItem.inviteTitle` 型別、`replyInquiry` 的通知呼叫，見 2.2）
- [x] 6.2 本機驗證：以本機 dev DB 建立測試提問並模擬 `deleteMember` 交易刪除該帳號，直接呼叫實際的 `getInquiryList()`（非僅 SQL 模擬）確認回傳 `isSubmitterDeleted: true` 且快照欄位（姓名、啟動編號、性別、單位）完整——卡片層 `isSubmitterDeleted` 條件式渲染（4.1／4.2）已由程式碼直接對應此欄位，邏輯已核對
- [x] 6.3 本機驗證：確認上述刪除動作於 `admin_action_logs` 產生一筆 `member_delete` 紀錄（`inviteTitle` 為 null），含操作者與被刪除帳號快照；驗證後已清除測試資料並以 `make prisma-dev-seed` 還原被刪除的測試學員帳號
- [x] 6.4 `inviteTitle` 改為可選未影響既有查詢／型別（`lib/data/admin-logs.ts` 已同步改為 `string | null`，`npm run build` 通過，課程操作 LOG 頁面未直接渲染此欄位）
