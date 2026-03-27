## 1. 資料庫 Schema 變更

- [x] 1.1 移除 `prisma/schema/course-invite.prisma` 中的 `token` 欄位
- [x] 1.2 執行 `make schema-update name=remove_invite_token` 產生並套用 migration

## 2. 移除 Token 路由與 Middleware

- [x] 2.1 刪除 `app/invite/` 整個目錄（含 `[token]/page.tsx`）
- [x] 2.2 移除 `app/middleware.ts` 中的 `/invite` public path 設定

## 3. 更新 Server Actions

- [x] 3.1 移除 `app/actions/course-invite.ts` 中的 `joinInvite()` 函式
- [x] 3.2 移除 `createInvite()` 中的 `randomBytes` import 及 token 產生邏輯

## 4. 更新 Data Layer 型別

- [x] 4.1 移除 `lib/data/course-sessions.ts` 的 `CourseSessionDetail` 型別中的 `token` 欄位
- [x] 4.2 移除 `getCourseSessionById()` 查詢中的 `token` select 欄位

## 5. 更新複製連結元件

- [x] 5.1 修改 `app/(user)/course/[id]/copy-invite-link-button.tsx`：prop 由 `token` 改為 `courseId: number`，複製 `${window.location.origin}/course/${courseId}` URL
- [x] 5.2 修改 `components/course-invite/invite-copy-button.tsx`：prop 由 `token` 改為 `courseId: number`，複製課程 URL
- [x] 5.3 修改 `components/course-invite/create-invite-form.tsx`：移除建立後顯示邀請連結的區塊，改顯示課程連結（需從 createInvite action 回傳 courseId）
- [x] 5.4 更新 `app/(user)/course/[id]/page.tsx`：將 `<CopyInviteLinkButton token={...}>` 改為傳入 `courseId`
- [x] 5.5 更新 `app/(user)/invites/page.tsx`：將 `<InviteCopyButton token={...}>` 改為傳入 `courseId`

## 6. 更新 createInvite Action 回傳值

- [x] 6.1 修改 `createInvite()` 回傳的 `data` 加入 `courseId`（供 form 顯示課程連結使用）

## 7. 驗證

- [x] 7.1 執行 `npm run build` 確認無 TypeScript 型別錯誤
- [x] 7.2 執行 `npm run lint` 確認無 lint 錯誤
- [x] 7.3 更新 `config/version.json` patch 版本號 +1
- [x] 7.4 更新 `README-AI.md` 反映本次變更
