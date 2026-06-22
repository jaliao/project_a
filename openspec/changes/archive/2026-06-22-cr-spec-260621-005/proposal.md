## Why

會員詳情頁目前僅有「基本資料／學習階層」兩個分頁，身分編輯與重設密碼散落、缺少講師授權的確認與通知，也沒有「暫停會員」這類風險控管操作。需重整詳情頁為四個分頁，並補上講師身分授權（含確認與發信）、特殊操作（暫停／補發密碼／特殊身分授權）與權限分級。

## What Changes

- **詳情頁改為四個分頁**：基本資料、學習階層、講師身分、特殊設定。
- **講師身分分頁**：
  - **推薦歷程**：唯讀顯示他人（各課程老師）推薦此會員成為講師的回饋（推薦書別、備註、推薦老師、時間）。
  - **設定講師身分授權**：以卡片呈現三本書講師身分，點擊 → **確認對話框** → 確認後授予/移除該身分；**授予講師身分時發信通知該會員**。
- **特殊設定分頁**：
  - **暫停會員**：封鎖該會員登入，記錄暫停時間、操作人員、原因；原因為下拉（密碼外洩／使用者要求／其他原因）可自行填寫；提供「恢復會員」解除。
  - **補發密碼**：沿用現有重設臨時密碼。
  - **特殊身分授權**：授予/移除 `admin`、`superadmin`。**admin 不可授權 superadmin；superadmin 可授權各種身分**。
- **登入封鎖**：被暫停會員 SHALL 無法登入（顯示暫停原因），恢復後始能登入。

## Capabilities

### New Capabilities
- `member-suspension`: 會員暫停／恢復 —— 封鎖登入、記錄暫停時間／操作人／原因（含下拉與自填），管理者可恢復。

### Modified Capabilities
- `admin-member-management`: 詳情頁重構為四分頁；新增講師身分授權（卡片＋確認＋授予發信）、推薦歷程顯示、特殊設定區（暫停／補發密碼／特殊身分授權）。
- `member-roles`: 身分授權權限分級 —— `admin` 可授予/移除書籍講師身分與 `admin`，但 SHALL NOT 授予/移除 `superadmin`；`superadmin` 可授予/移除所有身分。

## Impact

- `prisma/schema/user.prisma`：`User` 新增 `suspendedAt`、`suspendedById`、`suspendReason`（型別 enum）、`suspendReasonNote`；新增 `SuspendReason` enum → 需 migration。
- `lib/auth.ts`／`middleware.ts`／`(user)/layout.tsx`：登入與請求時檢查 `suspendedAt`，被暫停者擋下並導向帶原因的提示。
- `app/actions/admin.ts`：新增 `suspendMember`、`unsuspendMember`、`grantTeacherRole`／`revokeTeacherRole`（授予發信）、特殊身分授權（superadmin 規則）；既有 `updateMemberRoles` 加 superadmin 授權守衛。
- `lib/data/members.ts`：詳情查詢帶出暫停欄位與推薦歷程（instructor feedback where 此會員被推薦）。
- `app/(user)/admin/members/[id]/`：四分頁重構 + 新元件（講師身分卡片＋確認、暫停對話框、特殊身分授權）。
- `lib/mailer.ts`：講師身分授予通知信（沿用既有寄信＋ `resolveContactEmail`）。
- `config/version.json` patch +1；依 CLAUDE.md 第 9 點更新管理者手冊（會員詳情四分頁、暫停、授權）。
