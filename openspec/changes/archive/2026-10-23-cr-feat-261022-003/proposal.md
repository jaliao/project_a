## Why

CR-FEAT-261022-001 讓老師／管理者能建立「代填（未註冊）學員」，但該帳號結構上無 email、無法被聯絡，日後連結真實帳號僅能靠管理者手動跑「合併帳號」精靈。現場更常見的情境是：老師其實知道（或事後補得到）該學員的 email，希望能直接寄邀請連結，讓對方完成註冊時「自動變成」同一筆帳號，不需要管理者再手動合併；若對方始終沒有來註冊，這筆代填帳號也要能被其他課程照常找到、繼續邀請。

## What Changes

- 建立代填學員時新增選填 `email` 欄位；填寫後立即寄出邀請信（含一次性 token 連結），並將 email 寫回該筆 `User`（唯一性檢查，衝突則擋下並提示「此 Email 已被使用」）。
- 新增 `ProxyInviteToken` model（仿 `PasswordResetToken`／`EmailVerificationToken` 風格：`token`／`userId`／`email` 快照／`expiresAt`（30 天）／`usedAt`／`createdAt`）。
- 會員詳情頁（admin-only）新增「邀請 Email」欄位可編輯／補發：修改 email 或點「補發邀請」會核發新 token（舊 token 失效）並重新寄信。
- 新增「完成註冊」頁 `/complete-registration?token=xxx`（免登入，比照 `/reset-password` 頁 UX）：驗證 token 後讓使用者設定密碼，於同一筆 `User` 上寫入 `passwordHash`、將 `isProxyMember` 設為 `false`，token 標記已使用。
- `lib/auth.ts` 的 jwt callback 既有 Google OAuth 分支補一行：`dbUser.isProxyMember` 為真時翻為 `false`（Google 以受邀 email 登入時，既有 `allowDangerousEmailAccountLinking: true` 會自動綁定到這筆既有帳號，不會建立第二筆）。
- 自助註冊頁（`registerWithEmail`）行為不變：Email 已被使用即拒絕，不開放靠打對 email 認領代填帳號；認領僅能透過邀請信 token 或 Google OAuth（皆為已驗證 email 所有權的管道）。LINE 登入維持既有不自動連結設計，仍走人工合併精靈。

## Capabilities

### New Capabilities
- `proxy-invite`：代填學員的邀請信寄送、`ProxyInviteToken` 核發／補發／失效規則、完成註冊頁（驗證 token、設定密碼、`isProxyMember` 轉 `false`）、Google OAuth 以受邀 email 登入時自動連結同一帳號。

### Modified Capabilities
- `proxy-member-enrollment`：建立代填學員流程新增選填 `email` 欄位與寄信時機、唯一性衝突檢查（原規格僅收集姓名／性別／教會，不收集 email）。
- `admin-member-management`：會員詳情頁新增「邀請 Email」編輯與「補發邀請」操作入口。
- `public-route-registry`：`PUBLIC_PAGES` 新增 `/complete-registration`（token 帶於 query，免登入）。

## Impact

- **Schema**：`prisma/schema/user.prisma` 新增 `ProxyInviteToken` model；migration。
- **Server Actions**：`app/actions/invite-students.ts`（`addProxyStudentToInvite` 擴充 email 欄位與寄信）、`app/actions/member.ts` 或對應管理者操作檔（新增補發邀請／編輯邀請 email）、新增「完成註冊」action。
- **Mailer**：`lib/mailer.ts` 新增 `sendProxyInviteEmail`。
- **資料存取層**：仿 `lib/data/password-reset.ts` 新增 `lib/data/proxy-invite.ts`。
- **路由**：新增 `app/[locale]/(guest)/complete-registration/`；`lib/auth/route-access.ts` 註冊。
- **認證**：`lib/auth.ts` jwt callback Google 分支。
- **前端**：`components/admin/invite-student-cells.tsx`（代填學員表單加 email 欄）、會員詳情頁特殊設定分頁（邀請 Email 編輯／補發）。
- 依賴 CR-FEAT-261022-001（代填學員機制需先存在）；不重做合併精靈，LINE 登入或未經邀請管道完成註冊仍回退既有人工合併。
