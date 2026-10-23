## Context

CR-FEAT-261022-001 已建立「代填學員」機制：`User.isProxyMember = true`、`email`／`passwordHash` 皆為 `null`、無 `Account` 記錄，結構上無法登入也無法被聯絡。目前唯一的「本人後來補上帳號」路徑是管理者手動跑「合併帳號」精靈（`admin-member-management` 的合併帳號 Requirement），需要管理者主動發現兩筆帳號重複、手動選邊合併。

本變更的目標是讓「代填學員 → 本人完成註冊」這條路徑在已知對方 email 時可以自動化：老師/管理者填入 email 立即寄出邀請信，對方點連結設定密碼即完成註冊，**全程發生在同一筆 `User` 上**，不產生第二筆帳號、不需要事後合併。

現有可參考的同類型 token 流程：
- `PasswordResetToken`（`prisma/schema/user.prisma:221`）＋ `lib/data/password-reset.ts` ＋ `app/actions/auth.ts` 的 `requestPasswordReset`/`resetPassword`。
- `EmailVerificationToken` ＋ `sendCommEmailVerification`（通訊 Email 驗證，CLAUDE.md 第 10 點的唯一例外）。
- `/reset-password` 頁面（`app/[locale]/(guest)/reset-password/`）的兩欄品牌版型 UX，可直接比照建立 `/complete-registration`。

Google OAuth 既有設定 `allowDangerousEmailAccountLinking: true`（`lib/auth.ts`）：只要 Google 回傳的 email 與既有 `User.email` 相符，NextAuth adapter 就會自動把這次登入關聯到既有帳號、不建立新帳號。這代表「邀請信 token」與「受邀 email 的 Google 登入」兩個管道都能命中同一筆代填帳號，只差在 token 流程需要手動補一行把 `isProxyMember` 轉 `false`（Google 流程在 jwt callback 已有既有 Google/LINE 分支可以附掛這一行，見 Decisions）。

## Goals / Non-Goals

**Goals:**
- 代填學員建立時可選填 email，填寫即寄出邀請信；詳情頁可事後編輯/補發。
- 邀請信 token 一次性、30 天過期、可被補發邀請作廢重發。
- 完成註冊頁讓受邀者在**同一筆既有 `User`** 上設定密碼、解除 `isProxyMember`，不建立新帳號、不搬動任何既有關聯資料（因為本來就沒有分裂成兩筆）。
- Google OAuth 以受邀 email 登入時，同樣落在同一筆帳號並解除 `isProxyMember`。
- 自助註冊頁與 LINE 登入的既有行為完全不變（不作為認領代填帳號的管道）。

**Non-Goals:**
- 不重做合併帳號精靈，不處理「代填學員已被邀請、但對方用別的 email/LINE 完成自助註冊」而產生第二筆帳號的情況——此情況與 CR-FEAT-261022-001 範圍一致，仍回退既有人工合併。
- 不處理「同一代填學員被多位老師同時邀請不同 email」的衝突 UI 以外的額外防呆（唯一性檢查已足夠擋下衝突）。
- 不實作簡訊/LINE 邀請管道，僅 email。

## Decisions

### 1. `ProxyInviteToken` 獨立 model，不覆用 `PasswordResetToken`
兩者語意不同：`PasswordResetToken` 以 `email` 關聯（帳號本身已可登入，只是忘記密碼），`ProxyInviteToken` 則是「尚無密碼、尚未啟用」的首次設定，且需要 `userId` 直接鎖定目標帳號（代填學員 `email` 在核發時可能尚未存在於 `User` 上——寄信與寫回 `User.email` 是同一個 action 內的兩步，需保證原子性）。欄位比照既有風格：
```prisma
model ProxyInviteToken {
  id        String    @id @default(cuid())
  token     String    @unique
  userId    String    @db.Uuid
  email     String    // 核發當下的 email 快照，供信件內容與過期後比對
  expiresAt DateTime
  usedAt    DateTime?
  createdAt DateTime  @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("proxy_invite_tokens")
}
```
TTL 定 30 天（比密碼重設的 1 小時長，因為邀請信可能被老師轉交、對方不會立即處理）。

**Alternative considered**：在 `User` 上直接加 `inviteToken`/`inviteTokenExpiresAt` 欄位（不建獨立表）。放棄：補發邀請需要讓舊 token 立即失效且保留歷史核發紀錄以便除錯，獨立表＋`usedAt` 的語意與既有兩個 Token model 一致，改動最小。

### 2. email 唯一性檢查的時機與錯誤呈現
建立代填學員（`addProxyStudentToInvite`）與編輯邀請 email（新 action，暫名 `updateProxyInviteEmail`）皆需檢查 `prisma.user.findUnique({ where: { email } })` 是否已被其他 `User` 占用。衝突時回傳 `{ errors: { email: ['此 Email 已被使用'] } }`，與既有「後台新增會員」Email 重複錯誤訊息（`admin-member-management` 既有 Requirement）完全一致的字串，保持使用者體感一致。

檢查與寫入 `User.email` SHALL 在同一個 DB transaction 內完成（含核發 token、寄信排在 transaction 外，比照 `requestPasswordReset` 的 fire-and-forget 寄信模式，失敗只 log 不回滾）。

### 3. 補發邀請＝新 token＋舊 token 全部失效
補發時，先將該 `userId` 名下所有 `usedAt IS NULL` 的 `ProxyInviteToken` 標記 `usedAt = now()`（作廢），再核發一筆新 token。避免受邀者收到多封信、點了舊連結後又收到「連結已失效」疑惑——一律「最新一封才有效」。

### 4. 完成註冊頁的驗證與寫入邏輯（比照 `/reset-password`）
`/complete-registration?token=xxx`：
1. 查 `ProxyInviteToken`（`usedAt IS NULL && expiresAt > now()`），無效則顯示「邀請連結已失效，請聯繫老師重新發送邀請」。
2. 查 `User`，確認 `isProxyMember === true`（防呆：若該帳號已非代填狀態，代表已經透過其他管道完成註冊，一樣提示連結已失效，不重複處理）。
3. 使用者輸入密碼（規則同既有 `密碼格式規則`：至少 8 字元），送出後單一 transaction：`User.update({ passwordHash, isProxyMember: false, email: token.email })` ＋ `ProxyInviteToken.update({ usedAt: now() })`。
   - `email` 一併在這裡寫入（而不是只在建立/編輯時寫入）是保險：確保即使中途 email 被其他流程改動，最終完成註冊時仍以 token 核發當下快照的 email 為準；若此時該 email 已被別的帳號搶先占用（理論上不該發生，因為建立/補發時已檢查過），需再次唯一性檢查並拒絕，提示「此 Email 已被使用，請聯繫老師確認」。
4. 成功後導向登入頁並提示「註冊完成，請使用新密碼登入」。

此頁面不要求使用者再輸入 email（token 已鎖定身分），比 `/reset-password`（仅憑 token 修改密碼）更進一步同時解除代填狀態。

### 5. Google OAuth 自動連結：於既有 jwt callback Google/LINE 分支內補一行
`lib/auth.ts` 的 `jwt` callback 中，`account?.provider === 'google' || account?.provider === 'line'` 分支已經是「初次登入時對 dbUser 做補充寫入」的唯一地點（註解已說明「jwt 為唯一寫入點，避免 race condition」）。在這裡加一個獨立的欄位更新（不與 spiritId/姓名重試邏輯混在一起，各自失敗不互相影響）：
```ts
if (dbUser.isProxyMember) {
  dbUser = await prisma.user.update({
    where: { id: dbUser.id },
    data: { isProxyMember: false },
  })
}
```
放在既有 `if (account?.provider === 'google' || account?.provider === 'line')` 分支內——雖然 proposal 只要求 Google 分支，但 LINE 目前本來就不會自動連結到既有 email 帳號（`lineId` 独立 unique，`allowDangerousEmailAccountLinking` 未開），所以這筆判斷即使對 LINE 執行也不會誤觸：LINE 登入永遠建立新帳號或走既有 `lineId` 配對，不會命中代填帳號的 `id`，因此實務上只有 Google 分支會真正觸發。不另外拆分支，保持改動最小。

**Alternative considered**：另開一支「帳號連結後回調」。放棄：Google 自動連結完全由 NextAuth adapter 處理，應用層唯一能掛勾的時點就是 jwt callback 的 `user` 存在分支，無需新增機制。

### 6. 路由分組與唯一事實來源
`/complete-registration` 為免登入頁，依 CLAUDE.md 第 11 點規範：
- 置於 `app/[locale]/(guest)/complete-registration/`。
- 於 `lib/auth/route-access.ts` 的 `PUBLIC_PAGES` 新增一筆（`match: 'exact'`，reason：「代填學員完成註冊（token 帶於 query）」），比照既有 `/reset-password` 寫法。

### 7. 收件地址：此流程不適用 `resolveContactEmail()`
CLAUDE.md 第 10 點的外寄信件收件人規則，例外清單目前只列「通訊 Email 驗證信」。代填學員邀請信屬於第二個例外：此時 `User.commEmail` 必為 `null`（代填學員建立時不收集此欄位），`resolveContactEmail` 會直接退回帳號 `email`——而帳號 `email` 正是這裡要核發邀請、即將寫入的那個值，兩者結果一致，所以不需要真的呼叫 `resolveContactEmail()`，直接用核發時傳入的 email 寄信即可（避免呼叫時 `User.email` 尚未完成 transaction 寫入、查回舊值的時序問題）。補發邀請時同理，直接用當前 `User.email`／`ProxyInviteToken.email` 快照寄信。

## Risks / Trade-offs

- **[Risk] 老師填錯 email（誤填成第三人的信箱）** → 唯一性檢查只能擋「已被其他帳號使用」的情況，無法擋「誤填成一個全新、但不屬於該學員的信箱」。Mitigation：沿用現有「補發邀請」機制，詳情頁隨時可編輯 email 重新核發，發現錯誤後可立即修正；不在本變更範圍內做 email 格式以外的驗證。
- **[Risk] 受邀者遲遲不點連結，30 天後 token 過期** → Mitigation：詳情頁「補發邀請」隨時可重新核發，不需要等過期；完成註冊頁對過期 token 給出清楚指引（聯繫老師重新發送）。
- **[Risk] 同一代填學員被兩位老師分別用不同 email 邀請** → 第二位老師編輯 email 時會走補發流程（覆蓋為新 email、舊 token 作廢），原第一封邀請信連結即失效。Mitigation：此為既有「代填學員唯一 email」的自然結果（一筆 `User` 只有一個 `email`），不需額外機制；CLAUDE.md 既有規範「其他老師應透過選擇既有會員操作」可降低此情況發生頻率。
- **[Risk] 完成註冊 transaction 中 email 唯一性二次檢查失敗（罕見 race condition）** → Mitigation：捕捉 Prisma `P2002` unique violation，回傳具體錯誤訊息，不讓例外未經處理中斷頁面。

## Migration Plan

1. `prisma/schema/user.prisma` 新增 `ProxyInviteToken` model 與 `User` 反向關聯；`make schema-update name=add_proxy_invite_token`。
2. 純新增表與新增可選欄位使用（`User.email` 欄位已存在，不需 migration），對既有資料無破壞性影響，不需清空 DB 重置流程。
3. 部署順序：先部署 migration（`make prisma-test-deploy`），再部署應用程式（`make tunnel-deploy-test`）。
