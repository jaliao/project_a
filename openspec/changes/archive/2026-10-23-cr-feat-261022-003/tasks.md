## 1. Schema

- [x] 1.1 `prisma/schema/user.prisma` 新增 `ProxyInviteToken` model（`token`／`userId`／`email`／`expiresAt`／`usedAt`／`createdAt`，`userId` 關聯 `User` onDelete Cascade）
- [x] 1.2 於 `User` 補上反向關聯欄位
- [x] 1.3 `make schema-update name=add_proxy_invite_token` 建立並套用 migration

## 2. 資料存取層與寄信

- [x] 2.1 新增 `lib/data/proxy-invite.ts`：`getValidInviteToken(token)`、`invalidatePendingTokens(userId)`、`createInviteToken(userId, email)`（仿 `lib/data/password-reset.ts` 風格）
- [x] 2.2 `lib/mailer.ts` 新增 `sendProxyInviteEmail(email, completeUrl)`

## 3. 建立代填學員時的選填 Email

- [x] 3.1 `app/actions/invite-students.ts` 的 `addProxyStudentSchema`／`addProxyStudentToInvite` 新增選填 `email` 欄位（格式驗證）
- [x] 3.2 建立前於同一 transaction 內檢查 email 唯一性，衝突回傳 `{ errors: { email: ['此 Email 已被使用'] } }`，不建立任何帳號
- [x] 3.3 有填 email 時：建立成功後核發 `ProxyInviteToken` 並呼叫 `sendProxyInviteEmail`（transaction 外、fire-and-forget，失敗僅 log）
- [x] 3.4 `components/admin/invite-student-cells.tsx` 代填學員表單新增選填 Email 輸入欄與對應錯誤顯示

## 4. 會員詳情頁：邀請 Email 編輯與補發

- [x] 4.1 `app/actions/admin.ts` 新增 `updateProxyInviteEmail(userId, email)`：admin-only、唯一性檢查、更新 `User.email`、作廢舊 token、核發新 token、寄信
- [x] 4.2 `app/actions/admin.ts` 新增 `resendProxyInvite(userId)`：admin-only、不改 email，作廢舊 token、核發新 token、以目前 email 寄信
- [x] 4.3 會員詳情頁特殊設定分頁：`isProxyMember = true` 時顯示「邀請 Email」欄位（可編輯）與「補發邀請」按鈕，呼叫上述兩個 action
- [x] 4.4 操作成功／失敗的 toast 提示（含 Email 已被使用錯誤）

## 5. 完成註冊頁

- [x] 5.1 新增 `lib/schemas/auth.ts`（或既有檔案）的完成註冊表單 Zod schema（密碼長度 ≥ 8，比照既有密碼規則）
- [x] 5.2 `app/actions/auth.ts` 新增 `completeProxyRegistration(formData)`：驗證 token 有效且未使用未過期、對應 `User.isProxyMember === true`；transaction 內寫入 `passwordHash`、`isProxyMember = false`、token 標記 `usedAt`；捕捉罕見 email 唯一性衝突並回傳具體錯誤
- [x] 5.3 新增頁面 `app/[locale]/(guest)/complete-registration/page.tsx` ＋ `complete-registration-form.tsx`（版型比照 `app/[locale]/(guest)/reset-password/`）
- [x] 5.4 無效／過期／已使用 token 時顯示「邀請連結已失效，請聯繫老師重新發送邀請」，不顯示密碼表單
- [x] 5.5 成功後導向 `/login` 並提示「註冊完成，請使用新密碼登入」

## 6. 路由註冊

- [x] 6.1 `lib/auth/route-access.ts` 的 `PUBLIC_PAGES` 新增 `/complete-registration`（`match: 'exact'`，附 reason）

## 7. Google OAuth 自動連結

- [x] 7.1 `lib/auth.ts` 的 `jwt` callback，於既有 `account?.provider === 'google' || account?.provider === 'line'` 分支內新增獨立判斷：`dbUser.isProxyMember` 為真時更新為 `false`

## 8. 驗證

- [x] 8.1 手動驗證：建立代填學員填 email → 收到邀請信 → 點連結完成註冊 → 確認同一筆帳號 `isProxyMember` 變為 `false`，原課程報名/證書等紀錄不變
- [x] 8.2 手動驗證：改用 Google（同 email）登入也能自動連結到同一筆帳號
- [x] 8.3 手動驗證：補發邀請後舊 token 失效、新 token 有效
- [x] 8.4 手動驗證：自助註冊頁用已被邀請的 email 註冊時仍被拒絕
- [x] 8.5 手動驗證：始終未完成註冊的代填學員，可在第二堂課透過既有學員選擇元件（StudentPicker）找到並加入
- [x] 8.6 `npm run lint` 與 `npm run build` 通過

## 9. 文件同步

- [x] 9.1 依 CLAUDE.md 第 9 點，檢查並更新 `doc/管理者操作手冊.md`（新增邀請 Email 編輯/補發流程說明）；若老師/學員操作有異動一併更新對應手冊
- [x] 9.2 `config/version.json` patch 版本號 +1，`updatedAt` 更新為當日日期
- [x] 9.3 依 CLAUDE.md 第 8 點更新 `ai-context/` 有異動的章節檔（資料模型、業務邏輯、當前任務）
