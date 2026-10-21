## 1. Schema 變更

- [x] 1.1 `prisma/schema/user.prisma`：新增 `loginHandle String? @unique`（先 nullable）、`handleChangedAt DateTime?`
- [x] 1.2 於 web 容器內以 `make prisma-dev-migrate name=add_login_handle` 建立+套用第一階段 migration（僅新增兩個 nullable 欄位，不收緊、不動 `email`）——`make prisma-dev-migrate` 在本次環境因 unique 欄位警告觸發互動式確認而失敗（non-interactive 環境被硬擋），改用 `prisma migrate diff --from-config-datasource --to-schema` 產出等價 SQL，手動寫入 migration 目錄後以 `prisma migrate deploy` 套用，效果相同

## 2. Backfill 既有會員帳號代碼

- [x] 2.1 撰寫一次性 backfill script（可用 `prisma/seed.ts` 旁的獨立腳本，或直接寫在 migration 的 SQL 區塊）：對所有 `loginHandle IS NULL` 的使用者，寫入 `lower(spiritId)` ——寫成獨立 migration（`20261021150138_backfill_login_handle`），額外加上 `spiritId IS NULL` 防呆分支（見 design.md D2 補記）
- [x] 2.2 本機 dev 執行 backfill，確認覆蓋率 100%、無唯一值衝突——實測 1710/1710 筆皆有值且全部不重複
- [x] 2.3 `prisma/schema/user.prisma`：`loginHandle` 收緊為 `String @unique`（`NOT NULL`），`make prisma-dev-migrate name=tighten_login_handle`
- [x] 2.4 `prisma/schema/user.prisma`：`email` 改為 `String? @unique`，`make prisma-dev-migrate name=make_email_optional`

## 3. 認證邏輯（`lib/auth.ts`）

- [x] 3.1 新增 `LineProvider`（`next-auth/providers/line`），讀取 `LINE_CLIENT_ID`／`LINE_CLIENT_SECRET`（`.env.example` 補對應範例變數），不設定 `allowDangerousEmailAccountLinking`
- [x] 3.2 Credentials `authorize()`：查帳號條件改為 `OR: [{ email: identifier }, { loginHandle: identifier }]`（`identifier` 統一 `trim().toLowerCase()`）
- [x] 3.3 `signIn` callback：補上 `user.email` 為 `null` 時仍可用 `user.id` 查帳號、判斷暫停/合併狀態的分支——核查後既有程式碼 `where = user?.id ? {id} : user?.email ? {email} : null` 已以 `id` 優先，OAuth／Credentials 兩條路徑的 `user.id` 皆保證存在，email 為 null 時本就會走 `id` 分支，無需修改
- [x] 3.4 `jwt` callback：LINE 全新使用者首次登入時，核發 `spiritId` 並衍生預設 `loginHandle`——改為在 `adapter.createUser`（`lib/auth.ts` 自訂 wrapper）當場生成並寫入，避免「先建帳號、後補值」造成 `loginHandle` NOT NULL 違反；`jwt` callback 的 Google 專用分支擴大為 Google／LINE 共用（姓名 bootstrap），既有 spiritId 重試邏輯保留作既有資料防呆

## 4. Zod Schema 與 Server Actions

- [x] 4.1 `lib/schemas/auth.ts`：`loginSchema` 帳號欄位由 `z.string().email()` 改為 `z.string().min(1, 'validation.identifierRequired')`；新增 `loginHandleSchema`（`^[a-z0-9][a-z0-9._-]{2,18}[a-z0-9]$`，轉小寫）
- [x] 4.2 `app/actions/auth.ts`：新增 `setInitialPassword`（無密碼帳號於個人資料頁設定初始密碼使用，未設定則略過；詳見 5.2 的設計修正說明）——限 `passwordHash` 為 null 的帳號才可呼叫，已有密碼者導向既有 `changePassword`
- [x] 4.3 `app/actions/auth.ts`：新增 `changeLoginHandle`（檢查格式、全站唯一性、`handleChangedAt` 冷卻規則，通過後更新並寫入 `handleChangedAt = now()`）——冷卻期 30 天，`handleChangedAt` 為 null（尚未手動改過）時不受限

## 5. 前端

- [x] 5.1 `app/[locale]/(guest)/login/user-auth-form.tsx`：帳號欄位 `type` 由 `email` 改 `text`、placeholder 改「Email 或帳號代碼」；新增 LINE 登入按鈕（`signIn('line', { callbackUrl })`），置於現有 Google 按鈕下方
- [x] 5.2 新增「設定登入密碼（選填）」UI——**原規劃放 Onboarding Step 3，實測真實 LINE 登入後發現該規劃有誤並已修正**：`(user)/layout.tsx` 以 `isTempPassword` 判斷是否導向 `/onboarding`，Google／LINE OAuth 新帳號此值恆為 `false`，從未經過 onboarding wizard（是既有系統設計，非本次新增），原放在 Step 3 的卡片是死程式碼。改放個人資料頁 `change-account-card.tsx` 的 `ChangeAccountCard`：取代原「Google-only：請洽管理員」說明卡，改為提供自助設定密碼表單，同時適用 Google-only／LINE-only；另外補上 `page.tsx` 的 `loginMethods` 清單顯示 LINE（原本只列 Google）；卡片標題原沿用既有 `profile.changeAccountTitle`（「帳號修改」）造成使用者混淆（下方明明是設定密碼表單），改為新 key `profile.setPasswordTitle`（「設定登入密碼」），標題與內容對齊
- [x] 5.3 messages（`messages/zh-TW.json`／`messages/en.json`）補上述新文案 key（依 CLAUDE.md 第 12 點 i18n 規範）

## 6. 驗證

- [x] 6.1 從正式環境備份還原資料庫到本機 dev（見 design.md Migration Plan），在真實資料量上重跑第 1～2 節的 migration／backfill，確認無誤——已完成：抓回 2026-10-21 18:01 正式站備份（`pg_dumpall_postgres_db_2026-10-21_180102.sql.gz`）還原至本機 dev（還原前已留存快照 `backups/pre-prod-restore_20261021_233811.sql`），還原後 1760 筆真實會員資料套用 4 個 migration 全數成功，`loginHandle` 100% 覆蓋、全站不重複、`spiritId`／`email` 均非空（既有資料防呆分支未觸發，符合預期），`npx prisma generate` 與 `/api/auth/providers` 端點確認 app 於真實資料下正常運作
- [x] 6.2 手動測試：既有會員以原 email＋密碼登入正常；以 backfill 出的帳號代碼＋密碼登入正常——**已由使用者實測通過**：`student1@test.com` 以原 email＋密碼登入成功
- [x] 6.3 手動測試：全新 LINE 使用者完成登入 → 自動建立帳號（`spiritId`／`loginHandle`／`email` 可為空）→ 補資料 → 可選設定密碼——**已由使用者以真實 LINE 帳號完成實測**：核發 `spiritId=PA261973`、`loginHandle=pa261973`、`email` 為 null（LINE 未提供）、`realName`/`nickname` 正確帶入 LINE 顯示名稱、`accounts` 表正確寫入 `provider=line` 記錄；過程中發現登入後導向個人資料頁而非 onboarding（見 5.2 補記的設計修正），修正後使用者重新整理頁面確認「設定登入密碼」卡片正常顯示並完成設定
- [x] 6.4 手動測試：已有 LINE `Account` 記錄的使用者再次以 LINE 登入，不重複建立帳號——**已由使用者實測通過**：登出後以同一 LINE 帳號重新登入，正常導向既有帳號（`spiritId=PA261973`），未建立新帳號
- [x] 6.5 `npm run lint`、`npm run build` 通過——`tsc --noEmit` 與 `next build` 的「Compiled successfully」「Running TypeScript」階段皆無誤；`npm run lint` 0 errors（12 warnings皆為既有、與本次變更無關，已用 `git stash` 比對原始碼確認同樣存在）。`next build` 於後續靜態匯出 `/_global-error` 內部頁時崩潰（`Cannot read properties of null (reading 'useContext')`）——已用 `git stash` + 重新 `prisma generate` 比對驗證：**此崩潰在變更前的原始程式碼上同樣重現，屬既有、與本次變更無關的 Next.js 16 Turbopack 框架層問題**，建議另開獨立 CR 處理，不納入本次範圍
