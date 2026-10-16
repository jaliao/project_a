## Why

正式環境查證（2026-10-16）發現 22 筆會員帳號姓名完全未填（`nickname`／`realName`／`englishName` 皆空），均為自助索取臨時密碼註冊後**從未登入過**、未完成 onboarding 的帳號，已出現在會員資料庫與後台「未啟用會員」清單中。

本 CR 原規劃以「批次寄送提醒信」促使本人登入補資料（見本檔先前版本與 git 歷史），但這類帳號本來就是長期未登入才會落入此清單，無法保證本人會因一封信而登入補資料，管理者仍須後續人工追蹤才知道有沒有補成。改為**直接以 email 回填姓名**，可立即解決「（未填）」的顯示問題，不依賴本人配合、不需要後續追蹤。

（註：造成帳號姓名長期空白的根本流程缺陷，已另立 CR-FEAT-261016-001 處理，本次僅處理現有 22 筆既有資料的補救，兩者不互相依賴。）

## What Changes

- **撤回**先前已實作的「後台批次寄送補資料提醒信」功能（server action、未啟用會員清單頁的勾選/批次按鈕 UI、`sendProfileReminderEmail` 寄信樣板、`member_profile_reminder` 操作紀錄動作代碼），改採直接資料回填，此功能不再需要，程式碼已還原。
- 對**正式環境資料庫**執行一次性資料修正：將這 22 筆帳號的 `nickname`、`realName`、`englishName` 三欄皆設為其 email `@` 前綴原樣字串（例如 `t26103677@gmail.com` → `t26103677`），不做猜測性加工（不拆字、不轉大小寫、不去除數字——見 design.md 的理由）。
- 無 schema 變更、無新增 UI、無新增 capability。

## Capabilities

### No Capability Changes

本次為一次性生產環境資料修正，不新增或修改任何系統行為規格。先前版本曾規劃的 `admin-inactive-members` 批次提醒信能力已隨本次變更撤回，程式碼從未進入主線（本次 session 內尚未提交即已還原），不產生 delta spec、archive 時無需同步主規格。

## Impact

- 正式環境資料庫 `users` 表：22 筆既有資料列更新（僅 `nickname`／`realName`／`englishName` 三欄 + `updatedAt`），無結構異動，已於執行前以唯讀查詢核對清單（見 tasks.md）。
- 程式碼：還原先前為「批次提醒信」功能新增的檔案與片段：
  - 刪除 `app/actions/member-reminder.ts`、`components/admin/inactive-members-table.tsx`
  - `app/[locale]/(admin)/admin/members/inactive/page.tsx`、`config/admin-log-action.ts`、`doc/管理者操作手冊.md`、`doc/老師手冊.md`、`doc/學員手冊.md` 還原為變更前內容
  - `lib/mailer.ts` 移除 `sendProfileReminderEmail`（保留同檔案中屬於 CR-FIX-261016-001 的 `MAIL_OVERRIDE_TO` 邏輯，彼此獨立）
  - `lib/data/account-recovery.ts` 移除 `findTeachersForInactiveMember`／`InactiveMemberTeacher`（本次新增、未被其他功能使用，`listInactiveMembers` 為既有函式不受影響）
