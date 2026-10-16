## 1. 撤回「批次寄送提醒信」功能

- [x] 1.1 刪除 `app/actions/member-reminder.ts`、`components/admin/inactive-members-table.tsx`
- [x] 1.2 還原 `app/[locale]/(admin)/admin/members/inactive/page.tsx` 為變更前內容（維持原本純查詢頁面）
- [x] 1.3 還原 `config/admin-log-action.ts`（移除 `member_profile_reminder` 動作代碼）
- [x] 1.4 `lib/mailer.ts` 移除 `sendProfileReminderEmail`（保留同檔案屬於 CR-FIX-261016-001 的 `MAIL_OVERRIDE_TO` 邏輯，不互相影響）
- [x] 1.5 `lib/data/account-recovery.ts` 移除 `findTeachersForInactiveMember`／`InactiveMemberTeacher`（`listInactiveMembers` 為既有函式，不受影響）
- [x] 1.6 還原 `doc/管理者操作手冊.md`、`doc/老師手冊.md`、`doc/學員手冊.md` 為變更前內容（移除本次已撤回功能的說明）

## 2. 正式環境資料回填

- [x] 2.1 透過 SSH tunnel 連正式環境 DB，以唯讀查詢重新核對符合條件（`lastLoginAt` 為空、`nickname`／`realName`／`englishName` 皆空）的帳號，確認仍為 22 筆、id 與先前查證一致
- [x] 2.2 列出清單（spiritId／email／推算值）供使用者確認
- [x] 2.3 使用者確認後，鎖定這 22 筆 `id` 執行 `UPDATE`：`nickname`／`realName`／`englishName` 皆設為 email `@` 前綴原樣字串，`updatedAt` 設為執行當下時間
- [x] 2.4 執行後以 SELECT 覆核：22 筆皆已更新為預期值、資料庫中無其他資料列被誤動

## 3. 驗證

- [x] 3.1 `npx tsc --noEmit` 與 `npm run build` 皆成功（確認撤回程式碼未留下殘留引用／型別錯誤）
