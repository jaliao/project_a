## 1. Schema 共用化

- [x] 1.1 `lib/schemas/profile.ts`：抽出 `onboardingProfileSchema` 的基本資料欄位定義（`realName`／`phone`／`gender`／`birthYear`／`churchType`／`churchId`／`churchOther`）與教會 `superRefine` 邏輯為可重用的 shape/refine（例如 `basicProfileShape`、`applyChurchRefine`），`onboardingProfileSchema` 改為基於此組裝，行為不變
- [x] 1.2 `lib/schemas/auth.ts`：`registerSchema` 改為 `email` 欄位 + 1.1 的基本資料欄位組成，套用相同教會 `superRefine`

## 2. Server Action

- [x] 2.1 `app/actions/auth.ts` 的 `registerWithEmail`：
  - 改用新 `registerSchema` 解析 `formData` 全部欄位（email + 基本資料）
  - 驗證失敗（含 Email 已被使用）時維持現行行為，**不建立任何 `User` 紀錄**
  - 驗證通過後，`prisma.user.create` 一次寫入 `email`／`passwordHash`／`isTempPassword`／`spiritId` 與基本資料（`realName`／`phone`／`gender`／`birthYear`／`churchType`／`churchId`／`churchOther`，`churchId`/`churchOther` 依 `churchType` 清空另一邊，比照 `completeOnboardingProfile` 現有邏輯）
  - 寄送臨時密碼信邏輯不變

## 3. 前端 UI

- [x] 3.1 `app/[locale]/(guest)/register/page.tsx`：比照 onboarding page 呼叫 `getActiveChurches()`，傳入 `RegisterForm`
- [x] 3.2 `app/[locale]/(guest)/register/register-form.tsx`：表單擴充 `realName`／`phone`／`gender`／`birthYear`／所屬教會欄位，`resolver` 改用新 `registerSchema`；送出時組裝完整 `FormData` 呼叫 `registerWithEmail`。欄位 UI 與驗證錯誤顯示可重用 onboarding Step 2（`onboarding-wizard.tsx` 的 `Step2Profile`）既有的呈現邏輯與 i18n key（`onboarding.realName`／`onboarding.phone` 等），避免重複一份文案
- [x] 3.3 `app/[locale]/(guest)/onboarding/page.tsx`：額外算出 `profileAlreadyComplete = Boolean(realName && phone && gender && birthYear && churchType)`（需在既有 `select` 補 `gender`／`birthYear`／`churchType`），傳入 `OnboardingWizard`
- [x] 3.4 `app/[locale]/(guest)/onboarding/onboarding-wizard.tsx`：`OnboardingWizardProps` 新增 `profileAlreadyComplete: boolean`；Step 1 的 `onSuccess` 依此值 `setStep(profileAlreadyComplete ? 3 : 2)`

## 4. 操作手冊

- [x] 4.1 `doc/學員手冊.md`：註冊流程章節補充新增的基本資料欄位說明
- [x] 4.2 `config/version.json` patch +1，`updatedAt` 更新為當日日期

## 5. 驗證

- [x] 5.1 `npx tsc --noEmit` 與 `npm run build` 皆成功
- [x] 5.2 情境：`/register` 填妥 Email 與完整基本資料送出 → 建立成功、`User` 紀錄含全部基本資料、`spiritId`、`isTempPassword=true`，收到臨時密碼信。**已實測**（`docker compose exec web` 跑暫存腳本直接呼叫 `registerWithEmail`，與瀏覽器 Playwright 實際跑過一次完整表單並截圖確認成功 Dialog）：`User` 紀錄正確寫入全部欄位，驗證後已清除測試帳號
- [x] 5.3 情境：`/register` 只填 Email、未填任一基本資料欄位送出 → 回傳欄位錯誤，資料庫未新增任何 `User` 紀錄。**已實測**：server action 層與瀏覽器送出空白表單皆確認顯示欄位錯誤、未建立任何帳號（截圖確認）
- [x] 5.4 情境：`/register` 填寫已被使用的 Email（其餘基本資料皆有效）→ 回傳 Email 已被使用錯誤，不建立帳號。**已實測**（server action 層）：回傳 `{"success":false,"errors":{"email":["此 Email 已被使用"]}}`，同 email 帳號數維持 1
- [x] 5.5 情境：以新版 `/register` 建立的帳號首次登入 → Step 1 變更密碼後直接進入 Step 3，不經過 Step 2。**已實測**（瀏覽器 Playwright，種一筆基本資料已填妥的帳號，登入後完成 Step 1）：直接跳到 Step 3（步驟指示顯示 3/3），未顯示 Step 2 表單，截圖確認，驗證後已清除測試帳號
- [x] 5.6 情境：Google OAuth 首次登入（未經 `/register`）→ 仍自動建帳、仍需經過 onboarding Step 2 補填手機/性別/出生年/教會，不受影響。**以程式碼差異確認**：`git diff` 顯示 `lib/auth.ts` 零變更，OAuth 建帳與 jwt callback 邏輯未被本次改動觸及；無法在本機沙箱環境實際走 Google OAuth（需要真實 Google 帳號互動），未做瀏覽器實測
- [x] 5.7 情境：管理者於會員管理頁手動建立會員 → 仍只要求姓名，不要求手機/性別/出生年/教會，不受影響。**以程式碼差異確認**：`git diff` 顯示 `lib/member-creation.ts` 零變更，`createLoginableMember` 必填規則未被本次改動觸及
