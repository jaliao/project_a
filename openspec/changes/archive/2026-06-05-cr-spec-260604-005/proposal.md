## Why

目前會員的身分以單一 `UserRole` enum（`user` / `admin` / `superadmin`）表示，無法表達「同一人同時是講師又是管理者」等真實情境，且後台缺乏直接新增會員的入口（會員僅能透過 Google OAuth + 白名單進入）。本次優化讓後台能直接建立可登入的會員，並將身分改為多重身分模型，使管理更貼近實際組織角色。

## What Changes

- **多重身分模型（BREAKING）**：會員可同時隸屬多種身分——一般會員、講師、管理者、超級管理者；取代現行單一 `User.role` enum。
- **後台新增會員**：`/admin/members` 提供「新增會員」入口，可設定姓名、Email 與身分；建立時產生臨時密碼（`isTempPassword=true`）並加入白名單，會員首次登入須變更密碼。
- **會員列表調整**：移除「加入日期」欄位；新增「身分」欄位，顯示該會員擁有的所有身分。
- **講師身分作為開課權限**：開課（建立 `CourseInvite`）改為僅具「講師」身分（或管理者／超級管理者）的會員可執行。
- **授權邏輯改寫（BREAKING）**：所有以 `role === 'admin' / 'superadmin'` 判斷的守衛改為以「是否擁有某身分」判定，涵蓋 middleware、`auth()` session/JWT、後台頁面與 Server Actions。

## Capabilities

### New Capabilities
- `member-roles`: 會員多重身分模型——身分集合（一般會員 / 講師 / 管理者 / 超級管理者）的資料結構、指派與移除、以及「是否擁有某身分」的授權判定 helper。

### Modified Capabilities
- `admin-member-management`: 新增「後台新增會員」需求；列表移除「加入日期」欄位並改為顯示「身分」（所有身分）；詳情頁顯示與編輯多重身分。
- `create-course-session`: 開課改為需具「講師」身分（或管理者／超級管理者）方可建立課程。

## Impact

- **資料模型**：`prisma/schema/user.prisma` 由單一 `role` 改為多重身分（需 migration 將既有 `role` 轉換為對應身分集合，含 superadmin）。
- **認證／授權**：`lib/auth.ts`（JWT/session callbacks）、`app/middleware.ts`、`types/next-auth.d.ts`，以及所有後台頁面與 Server Actions（`app/(user)/admin/**`、`app/actions/**`）中以 `role === 'admin' | 'superadmin'` 判斷的守衛。
- **會員管理**：`lib/data/members.ts`（list/detail/export 的身分欄位）、`app/(user)/admin/members/**`、會員匯出（`member-export`）的身分欄位。
- **開課流程**：`app/actions/course-session.ts`、`app/actions/course-invite.ts` 的建立授權判定。
- **新增會員**：需新增建立會員的 Server Action（產生臨時密碼雜湊、寫入 `WhitelistedEmail`）。
