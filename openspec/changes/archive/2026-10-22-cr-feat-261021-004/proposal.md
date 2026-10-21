## Why

使用者希望支援多種第三方登入方式（Facebook、LINE、電話），並將「PA 帳號學員資料」與「登入方式」分離。評估後決定分階段進行，本次為 Phase 1：LINE OAuth 登入。

現況 `User.email` 為 `NOT NULL` + `UNIQUE`，且被 Credentials 登入直接當查詢鍵。LINE OAuth 預設不保證取得使用者 email，若要支援「以 LINE 全新註冊」（而非僅限既有帳號事後加綁），必須先解決「沒有 email 的會員要如何登入」的問題，否則建帳號當下就會因 email 必填而失敗。

使用者決定參考 LINE 本身的「@ID」設計：新增一個使用者自訂、全站唯一的「帳號代碼」（`loginHandle`），作為 email 之外的登入識別。全體會員（含現有會員）都會有這個欄位——現有會員由系統以既有 `spiritId` 衍生 backfill，之後可自行修改。

## What Changes

- `User.email` 由必填改為可選（nullable），放寬方向、不影響既有資料（既有會員全部已有 email）
- 新增 `User.loginHandle`（全站唯一、小寫正規化儲存，**NOT NULL**）與 `User.handleChangedAt`（改名冷卻判斷用）；既有會員以 `spiritId` 衍生值 backfill
- `lib/auth.ts` 新增 LINE OAuth provider，沿用既有 NextAuth `Account` 表（一對多登入方式關聯，Google 已經在用，不需新表）
- **自訂 NextAuth adapter 的 `createUser`**：Google／LINE 首次登入建帳號時，於同一次 INSERT 當場核發 `spiritId` 並衍生 `loginHandle`，避免「先建帳號、後補值」造成 `loginHandle` NOT NULL 約束違反（此為實作階段發現並修正的設計缺口，`loginHandle` 仍維持 NOT NULL，不是放寬為 nullable）
- Credentials 登入（`authorize()`／`signIn` callback）改為接受 email 或帳號代碼皆可查帳號
- 新增「以 LINE 全新註冊」流程：首次 LINE 登入若查無對應帳號 → 核發 `spiritId` → 衍生預設 `loginHandle` → `email` 可為 `null` → 導向既有 onboarding 補齊基本資料
- 登入頁新增「以 LINE 繼續」入口，與現有 Google 按鈕並列
- `email` 由必填改可選後，連動修正全站所有假設 `email: string`（非 null）的型別與顯示邏輯（約 20 個檔案：mailer 收件地址解析、帳號合併、重複帳號偵測、學員/老師選擇器、找回帳號、課程訂單快照等），確保 `npm run build`／`tsc` 全部通過
- **個人資料頁新增「設定登入密碼」自助功能**（取代原「尚未設定密碼」帳號只能顯示「請洽管理員」的既有限制）：無密碼帳號（LINE-only／Google-only）可在帳號修改卡片自助設定初始密碼，設定後可改用帳號代碼或 Email 搭配密碼登入；此功能原規劃放在 onboarding 流程，實測後發現全新 OAuth 帳號根本不會經過 onboarding（見 Impact 與 design.md D3 補記），已修正搬到個人資料頁

## Capabilities

### New Capabilities

- `line-oauth-login`：LINE OAuth 登入／註冊，含既有帳號登入、全新帳號自動建立、email 缺失時的行為規則、無密碼帳號自助設定登入密碼
- `login-handle`：帳號代碼（`loginHandle`）機制，含格式規則、既有會員 backfill、全站唯一性、使用者自行修改與改名冷卻、作為 Credentials 登入的替代識別鍵

### Modified Capabilities

（無——`email-registration`／`account-linking` 等既有 capability 的既定行為不變，僅新增平行的 LINE 路徑與帳號代碼識別鍵）

## Impact

- `prisma/schema/user.prisma`：`email` 改 nullable；新增 `loginHandle`（NOT NULL+UNIQUE）、`handleChangedAt`
- 4 個分段 migration（`add_login_handle` → `backfill_login_handle` → `tighten_login_handle` → `make_email_optional`），符合正式環境資料相容性要求（不可重置正式庫），已在本機 dev 以還原的正式環境真實資料（1760 筆會員）驗證通過（100% 覆蓋、無唯一值衝突）
- `lib/auth.ts`：新增 `LineProvider`；自訂 adapter 包裝 `createUser`；`signIn`／`jwt` callback 擴充 Google／LINE 共用邏輯
- `lib/spirit-id.ts`：新增 `deriveLoginHandle()` 共用衍生函式
- `lib/schemas/auth.ts`：`loginSchema` 改用 `identifier`（email 或帳號代碼）；新增 `loginHandleSchema`、`setInitialPasswordSchema`
- `app/actions/auth.ts`：新增 `setInitialPassword`、`changeLoginHandle`
- `app/[locale]/(guest)/login/user-auth-form.tsx`：新增 LINE 登入按鈕；帳號欄位改接受 email 或帳號代碼
- `app/[locale]/(user)/user/[spiritId]/profile/change-account-card.tsx`：無密碼帳號的「請洽管理員」說明卡改為「設定登入密碼」自助表單；`page.tsx` 的登入方式清單補上 LINE
- `lib/utils/contact-email.ts`、`lib/mailer.ts`、`lib/account-email-change.ts` 及約 15 個 Server Action／Data Layer 檔案：配合 `email` 可為 null 調整型別與寄信/顯示邏輯（詳見 tasks.md 第 6 節與各檔案內註解）
- 評估棄用 `User.lineId`（現有保留欄位），避免與 `Account` 表重複記錄 LINE 綁定狀態——本次僅標記不再寫入，不刪除欄位（正式環境相容）
- 不含：Facebook OAuth、電話 OTP 登入（Phase 2/3）；個人資料頁完整「登入方式管理」UI（解除綁定、多方式總覽）；後台會員匯出報表全面改版；`WhitelistedEmail` 白名單機制調整

## 實作後發現並記錄於 design.md 的額外風險

- 原規劃「設定登入密碼（選填）」步驟放在 onboarding wizard，實測真實 LINE 登入後發現全新 OAuth 帳號 `isTempPassword` 恆為 `false`、根本不會經過 onboarding wizard（既有系統設計），已修正搬到個人資料頁（見 Impact）
- `npm run build` 於靜態匯出 `/_global-error` 內部頁時崩潰（`Cannot read properties of null (reading 'useContext')`）——已用 `git stash` 比對驗證，**此崩潰在變更前的原始程式碼上同樣重現，屬既有、與本次變更無關的 Next.js 16 Turbopack 框架層問題**，建議另開獨立 CR 處理
