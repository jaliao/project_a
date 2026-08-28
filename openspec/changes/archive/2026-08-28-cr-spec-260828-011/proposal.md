## Why

需求單 CR-SPEC-260828-011（提出人：廖柏嘉 Justin，2026-08-28）：`lib/auth.ts` 的 jwt callback 在「後續請求」分支（`else if (token.id)`）用 `token.id` 查 DB 時，若 `dbUser` 查無（該 id 已不存在），目前**什麼都不做、原 token 照樣返回**，形成「殭屍 session」：

- token 裡的 `id` 已失效，但 `spiritId` / `roles` 等舊值仍在，`auth()` 仍回傳一個「看起來已登入」的 session。
- 頁面守衛多用 `session.spiritId` 反查 DB 取得**現在的** user id（能通過）；Server Action 多直接信 `session.user.id`（失效的舊 id）。兩者對「你是誰」判定不一致 → 出現「頁面進得去、送出動作被擋」的分裂狀態。

實際踩雷：CR-SPEC-260828-009「我的學習」測試時，本機 dev DB 曾於 2026-07-03 重建、使用者瀏覽器仍持有更早的 JWT，導致 `/user/{spiritId}/learning/{catalogId}` 頁面可進入、但 `createStudyEntry` 回「需先開始上課才能撰寫此課程的學習筆記」（`getUnlockedLearningCatalogIds(session.user.id)` 對失效 id 回空陣列）。

## What Changes

- **`lib/auth.ts` jwt callback 的後續請求分支（`else if (token.id)`）**：
  - `prisma.user.findUnique({ where: { id: token.id } })` 以 **try/catch** 包覆。
  - **查詢成功且 `dbUser === null`**（該 id 確定不存在）→ jwt callback **`return null`**，使 JWT session 失效；下一個受保護請求即被導回 `/login`，不再維持殭屍 session。
  - **查詢成功且有 `dbUser`** → 維持現有同步邏輯（`roles` / `spiritId` / `isTempPassword` / `isProfileComplete` / `email` / `avatarUrl`）。
  - **查詢拋例外**（DB 連線瞬斷等）→ `console.error` 記錄，**回傳原 `token`**（沿用舊值、不誤把全站使用者登出），待下次請求再同步。
- **初次登入分支（`if (user)`）不變**：該分支 `dbUser` 查無時本就不會寫入 `token.id`，session callback 取得的 id 為 undefined，已等同失效；為維持最小變更不動它。
- **不動** `signIn` callback、middleware、`(user)` / `(admin)` layout：session 失效後，受保護頁面由既有 layout 的 `auth()` → `null` → `redirect('/login')` 完成踢出。

## Capabilities

### New Capabilities
- `auth-session`：JWT session 生命週期規則（本次：`token.id` 指向不存在使用者時 session 失效；DB 錯誤時不誤殺）。

## Impact

- **Affected code**：`lib/auth.ts`（僅 jwt callback `else if (token.id)` 分支，約 10 行）。
- **Database**：無 schema 變更。
- **行為影響（全站）**：JWT 中 `token.id` 已不存在於 `users` 表的 session（本機 dev 重建 DB、跨環境舊 cookie、或帳號被硬刪）於**下一次請求**即失效、被導回登入頁——這是預期且正確的行為（NextAuth v5 對 jwt callback `return null` 的標準語意）。正常使用者、role/spiritId 變更、暫停會員等既有流程不受影響。
- **Docs**：純內部認證行為，`doc/` 三份操作手冊無對應段落；`config/version.json` patch +1（apply 時）。
- **Dependencies**：無新增套件。

## Open Questions

無。
