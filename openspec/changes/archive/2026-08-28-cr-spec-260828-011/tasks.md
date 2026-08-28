## 1. auth.ts jwt callback 加固

- [x] 1.1 `lib/auth.ts` jwt callback `else if (token.id)` 分支：`prisma.user.findUnique` 以 try/catch 包覆；catch → `console.error('[auth] jwt callback 查詢使用者失敗（保留現有 token）', e)` 後 `return token`
- [x] 1.2 查詢成功且 `!dbUser` → `console.warn('[auth] token.id 對應的使用者不存在，session 失效', token.id)` 後 `return null`（`next-auth@5.0.0-beta.30` jwt callback 型別已接受 `null`，`tsc` 0 errors，未用型別斷言）
- [x] 1.3 查詢成功且有 `dbUser` → 維持現有同步（`roles`／`spiritId`／`isTempPassword`／`isProfileComplete`／`email`／`avatarUrl`），欄位集合不變
- [x] 1.4 `if (user)` 初次登入分支、`signIn` callback、`session` callback、middleware、layout 皆未動

## 2. 驗證

- [x] 2.1 `npm run lint`：0 errors（16 個既有 warning，皆非本次）
- [x] 2.2 `npm run build`：`✓ Compiled successfully`、107/107 頁；`npx tsc --noEmit` 0 errors
- [x] 2.3 dev 站（`project-a-dev.blockcode.com.tw`）實測：credentials 登入 `student1@test.com` → `GET /user/pa269001` **200**、`/api/auth/session` 回傳完整 user（id/spiritId/roles）
- [x] 2.4 dev 站實測：`ON UPDATE CASCADE` 將 `PA269001` 的 `users.id` 暫改新 UUID（子紀錄隨之更新）後，帶**同一舊 cookie** → `GET /user/pa269001` 與 `/user/pa269001/learning` 皆 **307 → `/login`**、`/api/auth/session` 回 **`null`**（不再是殭屍 session）；隨即將 id 還原，`SELECT` 確認回復
- [x] 2.5 未實機停 DB（會影響整個 dev 環境、風險高）；以 code 結構保證：`catch` 分支僅 `console.error` + `return token`，不 `return null`、不 rethrow → DB 例外時不使 session 失效、不使請求 500
- [x] 2.6 迴歸：2.3 的 `/api/auth/session` 顯示 `roles`/`spiritId` 由 DB 即時同步（`dbUser` 存在分支邏輯未變），「無需重新登入即生效」行為正常

## 3. 版本號同步

- [x] 3.1 `config/version.json`：`0.1.179` → `0.1.180`，`updatedAt` 維持 `2026-08-28`
- [x] 3.2 `doc/` 三份操作手冊：`grep` 僅命中「暫停會員 session 即時被擋」與「角色即時生效」兩處，皆與本變更無關（不影響暫停流程與角色同步），不需更新
