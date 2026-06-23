## Why

目前 `User.lastLoginAt` 欄位雖已宣告，但登入流程從未實際寫入，導致無法得知會員是否曾登入、最近何時登入。管理者需要追蹤會員活躍度，特別是判斷新建會員是否已完成「首次登入」（臨時密碼是否真的被使用），以及掌握最近兩次登入時間以評估流失風險。

## What Changes

- 於每次登入成功（Google OAuth 與 Credentials 皆適用）時實際寫入登入時間。
- 新增 `User.previousLoginAt` 欄位，登入時將原本的 `lastLoginAt` 平移至 `previousLoginAt`，再把 `lastLoginAt` 設為當下時間，藉此保留「最後一次」與「上上次」兩個登入時間點。
- 會員詳情頁（`/admin/members/[id]` 基本資料分頁）新增顯示：**最後登入時間**、**上次登入時間**、**是否已完成首次登入**（依 `lastLoginAt` 是否為 null 判斷）、**是否已完成首次補填基本資料**（依 `realName` 與 `phone` 是否皆已填寫判斷）、**是否已更改臨時密碼**（依 `isTempPassword` 判斷；無密碼帳號顯示「不適用」）。
- 會員 Excel 匯出新增「最後登入」「上次登入」「已完成首次登入」「已完成首次補填」「已更改臨時密碼」欄位（既有匯出已含最後登入，補齊其餘）。

## Capabilities

### New Capabilities
- `login-activity-tracking`: 於登入成功時記錄會員的最後登入時間與上上次登入時間，作為活躍度追蹤的資料來源。

### Modified Capabilities
- `admin-member-management`: 會員詳情頁基本資料分頁與 Excel 匯出新增登入活躍度資訊（最後登入、上次登入、是否完成首次登入）、「是否完成首次補填基本資料」與「是否已更改臨時密碼」。

## Impact

- **Schema**：`prisma/schema/user.prisma` 新增 `previousLoginAt DateTime?`（需 migration）。
- **認證**：`lib/auth.ts` 於登入成功時更新 `lastLoginAt`／`previousLoginAt`。
- **資料層**：`lib/data/members.ts` 詳情查詢與 `exportMembers` 增加 `previousLoginAt`。
- **UI**：`app/(user)/admin/members/[id]/page.tsx`（基本資料分頁）顯示新欄位。
- **匯出**：`app/api/admin/members/export/route.ts` 新增欄位。
- **文件**：依規範更新 `doc/管理者操作手冊.md`、`config/version.json`、`README-AI.md`。
