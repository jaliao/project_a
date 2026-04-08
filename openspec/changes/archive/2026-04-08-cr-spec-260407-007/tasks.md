## 1. Server Action

- [x] 1.1 在 `app/actions/auth.ts` 新增 `completeOnboardingProfile(formData)` action：驗證 session、以 Zod 驗證 `realName`（非空）與 `phone`（非空），更新 DB，回傳 `ActionResponse`

## 2. Onboarding 頁面與 Wizard

- [x] 2.1 建立 `app/onboarding/page.tsx`（Server Component）：讀取 session + DB，若 `isTempPassword=false && realName && phone` 則 `redirect('/dashboard')`，否則渲染 `<OnboardingWizard />`
- [x] 2.2 建立 `app/onboarding/onboarding-wizard.tsx`（Client Component）：`useState` 管理 `step`（1/2/3）與 `spiritId`，兩欄品牌版型（參考 `/change-password/page.tsx`）
- [x] 2.3 實作 Step 1 表單：三個密碼欄（目前密碼、新密碼、確認新密碼）各加眼睛 icon，使用 `changePasswordSchema`，呼叫 `changeTempPassword` action，成功後儲存回傳 `spiritId` 並切換至 Step 2
- [x] 2.4 實作 Step 2 表單：`realName`（真實姓名）與 `phone`（手機號碼）欄位，加說明文字「其餘資料可於個人資料頁補填」，呼叫 `completeOnboardingProfile` action，成功後切換至 Step 3
- [x] 2.5 實作 Step 3 歡迎畫面：顯示「歡迎加入！您的靈人編號是 {spiritId}」，提供「開始使用」按鈕導向 `/dashboard`
- [x] 2.6 在 Wizard 頂部加入步驟進度指示（1/3、2/3、3/3），視覺上標示當前步驟

## 3. Middleware 更新

- [x] 3.1 在 `app/middleware.ts` 將 `isTempPassword` 攔截目標由 `/change-password` 改為 `/onboarding`，並將 `/onboarding` 加入公開路徑白名單（已登入但需 onboarding 才可存取）

## 4. Profile Completion Guard 更新

- [x] 4.1 在 `app/(user)/layout.tsx` 的排除路徑邏輯中，額外排除 `pathname === '/onboarding'`，防止 guard 與 onboarding 互相衝突

## 5. 驗證

- [x] 5.1 執行 `npm run build` 確認無 TypeScript 編譯錯誤

## 6. 版本與文件

- [x] 6.1 `config/version.json` patch 版本號 +1
- [x] 6.2 依 `.ai-rules.md` 更新 `README-AI.md`
