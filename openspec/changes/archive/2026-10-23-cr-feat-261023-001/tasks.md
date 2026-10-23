## 1. Schema

- [x] 1.1 `prisma/schema/user.prisma` 的 `ProxyInviteToken` 新增 `voidedAt DateTime?`
- [x] 1.2 `make schema-update name=add_proxy_invite_token_voided_at` 建立並套用 migration

## 2. 資料存取層

- [x] 2.1 `lib/data/proxy-invite.ts` 的 `invalidatePendingTokens(userId)` 改為 `where: { userId, usedAt: null, voidedAt: null }` → `data: { voidedAt: new Date() }`（不再寫 `usedAt`）
- [x] 2.2 `getValidInviteToken(token)` 的 `where` 新增 `voidedAt: null`
- [x] 2.3 `getActiveInviteForToken(token)` 沿用 `getValidInviteToken`，確認連帶生效
- [x] 2.4 新增 `getProxyInviteHistory(userId)`：`prisma.proxyInviteToken.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } })`，並附帶狀態計算輔助函式（已完成註冊／已作廢／已過期／有效，依 `usedAt`→`voidedAt`→`expiresAt`優先序）
- [x] 2.5 新增 `isClassTeacherOfMember(teacherId, memberId)`：`prisma.inviteEnrollment.findFirst({ where: { userId: memberId, invite: { createdById: teacherId } } })` 存在即回傳 `true`

## 3. Server Actions 授權放寬

- [x] 3.1 `app/actions/admin.ts` 的 `updateProxyInviteEmail`：權限檢查改為 `canAccessAdmin(session.user.roles) || await isClassTeacherOfMember(session.user.id, userId)`
- [x] 3.2 `app/actions/admin.ts` 的 `resendProxyInvite`：同上權限檢查

## 4. 會員首頁：新增「未註冊學員邀請管理」區塊

- [x] 4.1 `messages/zh-TW.json`／`messages/en.json` 新增 `studentProfile.proxyInvite.*`（`sectionTitle`／`emailLabel`／`emailPlaceholder`／`saveButton`／`resendButton`／`helperText`）
- [x] 4.2 新增 `components/dashboard/proxy-invite-panel.tsx`（client component，`useTranslations('studentProfile.proxyInvite')`，呼叫 `updateProxyInviteEmail`／`resendProxyInvite`，邏輯比照原 `member-proxy-invite-form.tsx`）
- [x] 4.3 `app/[locale]/(user)/user/[spiritId]/page.tsx`：查詢 `user.isProxyMember` 為真時才計算 `canManageProxyInvite = isAdmin || await isClassTeacherOfMember(session.user.id, user.id)`；兩者皆真才渲染新區塊，置於「基本資料」之後、「課程」之前
- [x] 4.4 刪除 `components/admin/member-proxy-invite-form.tsx`（不再被任何頁面引用）

## 5. 後台會員詳情頁：新增「未註冊會員專區」唯讀分頁

- [x] 5.1 `app/[locale]/(admin)/admin/members/[id]/page.tsx` 的 `TabsList` 新增 `proxy` 分頁（置於最前），`defaultValue` 維持 `info`
- [x] 5.2 `TabsContent value="proxy"`：呼叫 `getProxyInviteHistory(member.id)`，渲染新元件 `components/admin/member-proxy-invite-history.tsx`（無紀錄時顯示「尚無邀請紀錄」），不含任何編輯元件，對所有會員恆顯示（不依 `isProxyMember` 切換）
- [x] 5.3 原「特殊設定」分頁移除 `MemberProxyInviteForm` 區塊（及其外層容器 div/標題）

## 6. 邀請紀錄列表元件（後台）

- [x] 6.1 新增 `components/admin/member-proxy-invite-history.tsx`：純顯示元件，props 為歷史紀錄陣列（核發時間、email、狀態標籤、過期時間）
- [x] 6.2 狀態標籤呈現：已完成註冊／已作廢／已過期／有效，各搭配適當 Badge 樣式
- [x] 6.3 無紀錄時顯示「尚無邀請紀錄」

## 7. 失效文案更新

- [x] 7.1 `messages/zh-TW.json` 的 `account.completeRegistration.invalidDesc` 更新為「此邀請連結已失效或已被使用，請聯繫啟動事工同工或是授課老師重新發送邀請。」
- [x] 7.2 `messages/en.json` 同步英文版本
- [x] 7.3 `app/actions/auth.ts` 的 `completeProxyRegistration` 兩處 hardcoded 錯誤訊息更新為「邀請連結已失效，請聯繫啟動事工同工或是授課老師重新發送邀請」

## 8. 驗證

- [x] 8.1 驗證：管理者對代填學員 `canManageProxyInvite` 為 true（以程式化腳本對 dev DB 真實與拋棄式測試帳號驗證邏輯，非瀏覽器人工點擊；見下方說明）
- [x] 8.2 驗證：該班授課老師（非 admin）對自己班上代填學員 `isClassTeacherOfMember`／`canManageProxyInvite` 皆為 true
- [x] 8.3 驗證：無關老師、一般學員對同一代填學員 `canManageProxyInvite` 皆為 false
- [x] 8.4 驗證：`isProxyMember` 轉為 `false` 後，管理者與該班老師的 `canManageProxyInvite` 皆變為 false
- [x] 8.5 驗證：完成註冊（`isProxyMember=false`）後，`getProxyInviteHistory` 仍回傳完整歷史（未被清空/隱藏）
- [x] 8.6 驗證：補發邀請後舊 token 狀態為「已作廢」（`usedAt` 仍為 null）、新 token 狀態為「有效」，`getValidInviteToken` 對舊 token 回傳 null
- [x] 8.7 驗證：過期 token 狀態為「已過期」且 `getValidInviteToken` 回傳 null；`auth.ts`／`messages/zh-TW.json` 皆含更新後失效文案
  > 8.1–8.7 以 `tsx` 腳本直接呼叫 `lib/data/proxy-invite.ts`／`lib/auth-roles.ts` 的真實邏輯，對 dev DB 的真實帳號（管理者「系統管理者」、該班老師「廖柏嘉」、無關老師「孫淑華」、一般學員「測試學員1」）與一筆拋棄式測試代填學員執行，共 20 項斷言全數通過，執行後已清除所有測試資料。此法驗證的是後端邏輯正確性；**實際瀏覽器 UI 呈現（區塊位置、樣式、i18n 顯示）仍建議人工檢視一次**。
- [x] 8.8 `npm run lint` 與 `npm run build` 通過

## 9. 文件同步

- [x] 9.1 依 CLAUDE.md 第 9 點，檢查並更新 `doc/管理者操作手冊.md`／`doc/老師手冊.md`／`doc/學員手冊.md`（邀請 Email 管理入口改至會員首頁、授權老師可操作、後台新增唯讀邀請紀錄分頁、失效文案更新）
- [x] 9.2 `config/version.json` patch 版本號 +1，`updatedAt` 更新為當日日期
- [x] 9.3 依 CLAUDE.md 第 8 點更新 `ai-context/` 有異動的章節檔
