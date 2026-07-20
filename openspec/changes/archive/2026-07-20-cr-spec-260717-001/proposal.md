# Proposal: cr-spec-260717-001 課程頁新增學員改為僅限既有會員（移除自動建帳號）

## Why

課程頁「新增學員」（`addStudentToInvite`）目前查無 email 帳號時會**自動建立新帳號**（含臨時密碼、加入白名單）。任何具課程管理權限者（該課講師或管理者）皆可藉此任意 email 建立帳號，形同繞過白名單機制的帳號建立管道，屬於**安全疑慮**（非授權的帳號建立途徑、可能被用於建立非預期身分）。應改為僅能將**既有會員**加入課程，查無帳號時明確拒絕並提示。

## What Changes

- **移除自動建帳號分支**：`addStudentToInvite` 查無 email 對應之既有會員時，**不再建立新帳號**，直接拒絕並提示「查無此會員」。
- **新增改以「Email 或啟動編號（spiritId）」查找既有會員**：查找輸入改為單一欄位，可輸入 Email 或啟動編號；找到既有會員後 SHALL 顯示確認列（顯示會員姓名／編號）供勾選加入；找不到則提示「查無此會員，請確認 Email 或啟動編號」且不可送出。
- **移除**「姓名」輸入欄位（原用於建新帳號，找到既有會員後直接用其既有姓名，不需再填）與臨時密碼一次性顯示畫面（不再有建帳號情境）。
- **補登結業**功能不變（沿用既有勾選＋結業日欄位）。

## Capabilities

### New Capabilities

（無）

### Modified Capabilities

- `admin-enrollment-management`：「新增學員」相關 requirement 由「email 既有帳號掛入／查無建新帳號」改為「僅限既有會員；以 Email 或啟動編號查找；查無則拒絕」。

## Impact

- **Server Action**：`app/actions/invite-students.ts`（`addStudentToInvite` 移除 `createLoginableMember` 分支；`lookupMemberByEmail` 擴充或新增「以 Email 或啟動編號查找」的查詢）
- **資料層**：`lib/data/invite-students.ts`（`findMemberByEmail` 擴充為 Email 或 spiritId 查找，或新增 `findMemberByEmailOrSpiritId`）
- **UI**：`components/admin/invite-student-cells.tsx`（`AddStudentDialog`：查找欄位改單一輸入框、移除姓名欄與建帳號完成畫面）
- **文件**：`doc/管理者操作手冊.md`、`doc/老師手冊.md`（新增學員流程描述）同步；`config/version.json` patch +1
- **無 migration**
