# Design: cr-feat-261021-004 LINE OAuth 登入與帳號代碼機制

## Context

`User`（`prisma/schema/user.prisma`）目前以 `email String @unique`（`NOT NULL`）作為登入帳號，`lib/auth.ts` 的 Credentials provider 直接 `where: { email }` 查帳號；Google OAuth 走標準 NextAuth `Account` 表（`provider`+`providerAccountId`，一對多關聯至 `User`），並用 `allowDangerousEmailAccountLinking: true` 讓 email 相同時自動連結既有帳號。

LINE OAuth 預設不保證回傳使用者 email（需另向 LINE 官方申請 email scope 審核，且使用者可拒絕授權），若沿用「建帳號 = 一定有 email」的現況，LINE 全新註冊會直接卡在 `email` 的 `NOT NULL` 約束。`User.lineId String? @unique` 是既有保留欄位（註解「第三方帳號」），但走的是獨立欄位而非 `Account` 表，與 Google 的設計不一致。

系統已上線、有正式營運資料，所有 schema 變更必須相容既有資料（additive/放寬優先，破壞性變更需搭配回填策略）。

## Goals / Non-Goals

**Goals:**
- 新增 LINE OAuth 登入入口，既有帳號可直接登入、全新使用者可自動建立帳號
- 解決「沒有 email 的會員如何登入」：引入使用者自訂、全站唯一的「帳號代碼」（`loginHandle`），作為 email 之外的 Credentials 登入識別，且**不放寬為 nullable**（見 D1 補記）
- 既有會員（全部已有 email）不受影響，`loginHandle` 由系統自動 backfill，無需使用者動作
- Migration 過程對正式資料零風險（分步、可回滾、無資料遺失）

**Non-Goals:**
- 不做 Facebook OAuth、電話 OTP 登入（後續 CR）
- 不做個人資料頁完整「登入方式管理」UI（解除綁定、多方式總覽等）——本次僅新增登入入口、必要的首次註冊流程，以及最小必要的「設定初始密碼」自助功能（見 D3 補記）
- 不改動後台會員匯出報表（Email 欄顯示空白為已知現象，欄位重新設計留待後續 CR）
- 不改動 `WhitelistedEmail` 機制——LINE／帳號代碼登入路徑不經過白名單，維持現狀

## Decisions

### D1：`loginHandle` 作為獨立識別鍵，維持 NOT NULL（實作時修正）

`User` 新增：

```prisma
model User {
  ...
  email           String?   @unique   // NOT NULL → nullable
  loginHandle     String    @unique   // 新增，小寫正規化儲存，維持 NOT NULL
  handleChangedAt DateTime?           // 新增，null = 尚未手動改過（backfill 不算）
  ...
}
```

- **大小寫**：輸入即正規化成小寫儲存與比對，不引入 `citext` extension
- **格式**：`^[a-z0-9][a-z0-9._-]{2,18}[a-z0-9]$`（總長度 4–20，首尾限英數字，中間可含 `.`/`_`/`-`，不可連續符號——交由 Zod regex 一次驗證，不在 DB 層加 `CHECK`）
- **唯一性**：`@unique` 由資料庫保證，衝突時 Server Action 回傳欄位錯誤「此帳號代碼已被使用」

**⚠️ 實作時發現並修正的設計缺口**：原計畫比照既有 `spiritId`（nullable，「先建帳號、後補值」）的模式處理 `loginHandle`，但 NextAuth 的 `PrismaAdapter.createUser()` 在 OAuth 首次登入時，是先用 OAuth profile 本有欄位（email/name/image）直接 `INSERT` 一筆 `User`，之後才觸發 `jwt` callback 補 `spiritId`。若 `loginHandle` 也採同樣時序但維持 `NOT NULL`，這次 bare INSERT 會因約束違反直接失敗，新使用者完全登不進來（連現有 Google 登入都會壞掉）。

**修正方案**：不放寬 `loginHandle` 為 nullable，改為把「核發 `spiritId`」的時間點提前到 INSERT 之前——`generateSpiritId()` 本身不依賴 `User.id`，只是一個獨立的年度流水號計數器，可以在呼叫 `create()` 之前先算出來。做法：

```ts
// lib/auth.ts
const prismaAdapter = PrismaAdapter(prisma)
const adapter: Adapter = {
  ...prismaAdapter,
  async createUser(data) {
    const spiritId = await generateSpiritId()
    const merged = { ...data, spiritId, loginHandle: deriveLoginHandle(spiritId) }
    return prismaAdapter.createUser!(merged)
  },
}
```

`deriveLoginHandle(spiritId)`（新增於 `lib/spirit-id.ts`）即 `spiritId.toLowerCase()`，與既有會員 backfill 用的衍生規則一致。所有其他直接呼叫 `prisma.user.create()` 的路徑（`registerWithEmail`、`createLoginableMember`、`prisma/seed.ts` 各處、`test-course-session.ts`）本來就已經呼叫 `generateSpiritId()`，一併補上 `loginHandle: deriveLoginHandle(spiritId)` 即可，不需要額外的「先建後補」流程。

- 替代方案（已否決）：把 `loginHandle` 改為 nullable——會讓「帳號代碼」這個全新機制一出生就跟 `email` 一樣有「可能缺值」的脆弱性，且需要額外的「至少一種登入識別」應用層驗證；改為提前核發 `spiritId` 的成本更低、更一致。

### D2：既有會員 backfill 規則

- 衍生方式：`loginHandle = spiritId.toLowerCase()`（例如 `PA260001` → `pa260001`）——`spiritId` 本身全站唯一，衍生值不會衝突，backfill script 不需重試邏輯
- **實作時發現**：`User.spiritId` 在 schema 上是 `String?`（nullable），理論上可能存在 `spiritId IS NULL` 的既有資料列（例如 Google 首登核發流程中斷）。Dev 環境與**還原的正式環境真實資料（1760 筆）**實測皆為 0 筆，但 backfill SQL 仍加一道防呆：`spiritId IS NULL` 的列改用 `'u' || id 前 16 位十六進位字元` 衍生，確保收緊 `NOT NULL` 前 100% 覆蓋
- `handleChangedAt` backfill 為 `null`（代表「系統自動產生，使用者尚未主動改過」），之後使用者第一次手動修改時才寫入 `now()` 作為冷卻起算點
- Migration 順序（對應正式環境相容性要求，每步皆可獨立驗證，實作時因環境限制改用手動撰寫 migration SQL + `prisma migrate deploy` 套用，效果等同 `prisma migrate dev`）：
  1. `ALTER TABLE users ADD COLUMN "loginHandle" TEXT;`（nullable，先不加 unique）＋ `ADD COLUMN "handleChangedAt" TIMESTAMP;`
  2. 一次性 backfill migration（純 DML）：`spiritId` 存在者轉小寫衍生；`spiritId IS NULL` 者用 id 衍生防呆
  3. 確認覆蓋率 100% 後：`ALTER TABLE users ALTER COLUMN "loginHandle" SET NOT NULL;`
  4. `ALTER TABLE users ALTER COLUMN "email" DROP NOT NULL;`
  5. **已於還原的正式環境真實資料（1760 筆會員）上完整重跑並驗證通過**：100% 覆蓋、全站不重複、無唯一值衝突、`npx prisma generate` 與 `/api/auth/providers` 端點確認 app 正常運作

### D3：LINE 登入／註冊流程，不自動連結既有帳號

- `lib/auth.ts` 新增 `Line`（`next-auth/providers/line`），**不設定** `allowDangerousEmailAccountLinking`（維持 NextAuth 預設關閉）——理由：LINE 的 email 不保證存在、取得也可能是使用者較少使用的信箱，若自動以 email 連結既有帳號，一旦 email 被他人搶先設定在別的帳號上，有帳號接管風險；Google 現有的自動連結行為不變
- `signIn({ user })` callback：既有程式碼 `where = user?.id ? {id} : user?.email ? {email} : null` 已以 `id` 優先查帳號——OAuth（adapter 已給定 `id`）與 Credentials（`authorize()` 回傳含 `id`）兩條路徑的 `user.id` 皆保證存在，email 為 `null` 時本就會走 `id` 分支，**核查後確認不需修改**
- `jwt` callback 的 Google 專用分支（spiritId 重試＋姓名 bootstrap）擴大為 Google／LINE 共用；新帳號的 `spiritId`／`loginHandle` 已在 `adapter.createUser` 當場寫入，原有的 spiritId 重試邏輯保留作既有資料防呆（理論上不會再觸發）
- 全新 LINE 使用者登入後導向既有 onboarding 頁補齊 `realName`／`phone` 等基本資料
- `LINE_CLIENT_ID`／`LINE_CLIENT_SECRET` 已於本機 dev `.env` 設定（LINE Developers Console 的 LINE Login channel），`/api/auth/providers` 端點確認 `line` provider 正確載入，Callback URL 為 `https://project-a-dev.blockcode.com.tw/api/auth/callback/line`

**⚠️ 實測時發現並修正的設計缺口（二）**：原規劃「設定登入密碼（選填）」放在 onboarding wizard 的 Step 3；實際用真實 LINE 帳號登入測試時發現：`(user)/layout.tsx` 判斷是否強制導向 `/onboarding` 的條件是 `isTempPassword === true`，而 Google／LINE OAuth 建立的帳號 `isTempPassword` 恆為 `false`（只有 Credentials／後台建帳號才會設為 `true`）——這條路是系統既有設計，Google 新使用者原本就不會進入 `/onboarding`，而是被 layout 的「Profile 完整度」檢查導向 `/user/{spiritId}/profile?incomplete=1`。全新 LINE 使用者走的是同一條既有路徑，**從未經過 onboarding wizard**，原先塞進 Step 3 的「設定登入密碼」卡片是永遠不會被觸發的死程式碼。

**修正方案**：移除 onboarding wizard 裡的設定密碼卡片，改放在個人資料頁的 `ChangeAccountCard`——原本該元件對「無密碼帳號」顯示的是「Google-only：請洽管理員協助修改」說明卡（既有行為），現改為提供自助設定密碼表單（呼叫 `setInitialPassword`），同時適用 Google-only 與 LINE-only 兩種情境，不限 LINE。順便補上個人資料頁「登入方式」清單顯示 LINE（原本只列 Google／密碼）。此修正已實測驗證：以真實 LINE 帳號登入（核發 `spiritId=PA261973`、`loginHandle=pa261973`、`email` 為 `null`、`realName`／`nickname` 正確帶入 LINE 顯示名稱、`accounts` 表正確寫入 `provider=line` 記錄）→ 登入後被導向個人資料頁（非 onboarding）→ 符合修正後的預期行為。

### D4：Credentials 登入接受 email 或帳號代碼

- `lib/auth.ts` 的 Credentials `authorize()`：

  ```ts
  const identifier = (credentials.identifier as string).trim().toLowerCase()
  const user = await prisma.user.findFirst({
    where: { OR: [{ email: identifier }, { loginHandle: identifier }] },
  })
  ```

- `lib/schemas/auth.ts`：`loginSchema` 的帳號欄位由 `email: z.string().email(...)` 改為 `identifier: z.string().min(1, 'validation.identifierRequired')`
- 登入頁（`user-auth-form.tsx`）輸入框 placeholder 改「Email 或帳號代碼」，`type` 由 `email` 改 `text`，新增 LINE 登入按鈕

### D5（實作新增）：`email` 放寬為 nullable 後的全站型別連動修正

`email` 改為 `string | null` 後，`tsc --noEmit` 檢出約 20 個檔案的型別錯誤（假設 `email: string` 非 null），逐一修正：

- `lib/utils/contact-email.ts`：`resolveContactEmail()` 回傳型別改 `string | null`，所有呼叫端（`app/actions/auth.ts`、`admin.ts`、`member-merge.ts`、`course-invite.ts`、`account-recovery.ts`）加上 `if (to) { ... }` guard，無可用 email 時略過寄信
- `lib/mailer.ts`：`isUndeliverableEmail()` 接受 `string | null`
- `lib/account-email-change.ts`：`validateNewAccountEmail`／`applyAccountEmailChange` 的 `currentEmail`/`oldEmail` 改 `string | null`，支援「原本沒有 email 的帳號現在要新增一個」情境
- `lib/data/account-recovery.ts`、`lib/data/duplicate-accounts.ts`、`lib/data/student-picker.ts`、`lib/data/teacher-picker.ts`：對應型別（`RecoverableAccount`、`InactiveMember`、`CandidateUser`、`DuplicateCandidateSide`、`StudentPickerCandidate`、`TeacherPickerCandidate`）的 `email` 欄位改 `string | null`
- `app/actions/member-merge.ts`、`app/actions/admin.ts`、`app/actions/invite-students.ts`：稽核紀錄快照字串（`${realName}（${email}）`）在 `email` 為 `null` 時改顯示「無 Email」而非空括號
- `app/actions/course-order.ts`：`CourseOrder.email`（獨立的訂單聯絡 email 快照欄位，schema 仍為 `NOT NULL`，與登入 email 無關）改為 `teacher.commEmail || teacher.email || ''`，沿用既有同一物件其他欄位的 `|| ''` fallback 慣例
- `components/admin/member-email-form.tsx`、`components/admin/member-merge-dialog.tsx`、`app/[locale]/(user)/user/[spiritId]/profile/change-account-card.tsx`：`currentEmail`／`AccountRef.email` 型別改 `string | null`，顯示層補「（尚未設定，可能僅以 LINE 登入）」等提示文字

## Risks / Trade-offs

- [Risk] LINE Login 若尚未通過官方 email scope 審核，所有 LINE 使用者都會是「無 email」——審核流程非工程可控，需使用者先行確認 LINE Developers Console 的審核狀態；若未過審，功能仍可運作（走帳號代碼路徑），僅是 email 欄位長期為空
- [Risk] 全新 LINE 使用者若未設定登入密碼、且之後解除 LINE 綁定（本次不提供解除綁定 UI，但未來 Phase 會有）→ 會變成無法登入的孤兒帳號——本次透過個人資料頁的「設定登入密碼」自助功能降低機率，徹底防呆（強制至少一種非 OAuth 登入方式）留待後續「登入方式管理」CR 處理
- [Risk] `loginHandle` 格式規則（長度、字元集）目前依 LINE 慣例訂定，若與使用者既有行銷素材／手冊規範衝突，需在實作前再次確認（見 Open Questions）
- [Trade-off] 不自動連結 LINE 與既有 email 帳號，使用者可能因此意外建立重複 PA 帳號——與現有「帳號合併」（`mergedIntoId`）機制互補，重複帳號可由後台人工合併，不在本次自動化
- [Risk，實作後發現] `npm run build` 於靜態匯出 `/_global-error` 內部頁時崩潰——已用 `git stash` 比對驗證為既有、與本次變更無關的 Next.js 16 Turbopack 框架層問題（原始碼同樣重現），不影響本次變更本身的正確性，建議另開獨立 CR 處理
- [注意] 本機 dev 資料庫目前存放的是**還原自正式環境的真實會員 PII**（1760 筆真實姓名、Email、電話等），非測試資料——驗證完成後應注意後續資料保管（依既有 dev 環境資料處理慣例辦理，非本次變更新增風險）

## Migration Plan

見 D2 的 5 步順序。**已完成**：

1. ~~從正式環境備份（本機磁碟路徑或 R2 離站備份）還原到本機 dev 容器~~ ✅ 已還原 2026-10-21 18:01 備份
2. ~~在還原的真實正式資料量上重跑上述 migration／backfill~~ ✅ 1760 筆真實會員資料，100% 覆蓋、無唯一值衝突、`email` nullable 後查詢正常

尚待執行：

3. 驗證通過後才將 migration 套用至 stg（`make prisma-test-deploy`）與正式環境

## Open Questions

- `loginHandle` 的長度與字元集規則（本次採 4–20 字元、`a-z0-9._-`）是否需要調整？
- 改名冷卻天數（本次預設 30 天）是否符合使用者期望？
- LINE Developers Console 的 email scope 審核目前狀態（是否已申請／已通過）？影響本次上線後 LINE 使用者是否普遍無 email
- `npm run build` 的 `/_global-error` 崩潰是否要另開 CR 修復？（與本次變更無關，但影響正式部署前的 build 驗證流程）
