## Why

目前 `app/actions/auth.ts` 的 `registerWithEmail()` 在使用者於 `/register` 頁只送出 Email 的瞬間就建立 `User` 紀錄（僅 `email`／`passwordHash`／`isTempPassword`／`spiritId`），姓名等基本資料全空；後續靠登入後的 onboarding 三步驟精靈（Step 2，`completeOnboardingProfile`）才補填 `realName`／`phone`／`gender`／`birthYear`／所屬教會。

若使用者索取臨時密碼後未登入、或登入後中途放棄 onboarding Step 2，該帳號會永久留空這些基本資料，但已經出現在正式會員資料庫與會員列表中。正式環境查證（2026-10-16）：22 筆帳號姓名完全空白，且全部從未登入過。

（註：這 22 筆既有資料的補救動作已另立 CR-SPEC-261016-001 處理；本 CR 是治本的流程修正，防止未來再產生這類帳號，兩者不互相依賴。）

## What Changes

- `/register` 頁的 Email 註冊表單，擴充為與 onboarding Step 2 相同的完整基本資料欄位：`realName`（真實姓名）、`phone`（手機號碼）、`gender`（性別，男／女）、`birthYear`（出生年）、所屬教會（`churchType` 及對應 `churchId`／`churchOther`），與 Email 同一次送出、同一次驗證。
- `registerWithEmail()` 改為**先驗證全部欄位皆有效，驗證不通過時不建立任何 `User` 紀錄**；驗證通過後才一次性建立帳號（含上述基本資料、`spiritId`、臨時密碼）並寄送臨時密碼通知信。亦即：送出表單前的輸入都只存在於使用者瀏覽器當下這次提交中，沒有任何伺服器端暫存紀錄；只有驗證通過、真正建立 `User` 的那一刻才算「註冊成功」。
- Onboarding 精靈判斷：若登入時帳號已具備完整基本資料（即透過新版 `/register` 建立的帳號），完成 Step 1（變更臨時密碼）後直接跳至 Step 3（歡迎畫面），不再重複顯示 Step 2。
- 不影響既有流程：Google OAuth 首次登入仍自動建帳（姓名由 Google 帶入，手機/性別/出生年/教會仍透過 onboarding Step 2 補填）；管理者/講師手動建立會員（`createLoginableMember`）維持原規則不變。

## Capabilities

### Modified Capabilities

- `email-registration`：`/register` 表單擴充為完整基本資料驗證，驗證不通過不建立帳號。
- `onboarding-wizard`：帳號已具完整基本資料時，Step 1 完成後跳過 Step 2 直接進入 Step 3。

## Impact

- Schema：`lib/schemas/auth.ts` 的 `registerSchema` 擴充為 email + 完整基本資料欄位；與 `lib/schemas/profile.ts` 的 `onboardingProfileSchema` 共用欄位定義（抽出共用部分避免重複驗證規則/錯誤訊息）。
- Server Action：`app/actions/auth.ts` 的 `registerWithEmail()` 改為驗證全部欄位後才建立 `User`（含 `realName`／`phone`／`gender`／`birthYear`／`churchType`／`churchId`／`churchOther`），邏輯比照 `completeOnboardingProfile` 的欄位寫入方式。
- 前端：`app/[locale]/(guest)/register/page.tsx` 取得教會清單（比照 onboarding page 的 `getActiveChurches`）傳入 `RegisterForm`；`register-form.tsx` 新增基本資料欄位（UI 可與 onboarding Step 2 共用呈現邏輯）。
- Onboarding：`app/[locale]/(guest)/onboarding/page.tsx` 計算帳號是否已具完整基本資料並傳入 `OnboardingWizard`；`onboarding-wizard.tsx` 的 Step 1 完成後依此決定跳至 Step 2 或直接 Step 3。
- 不涉及資料庫 schema 變更（沿用既有 `User` 欄位）；不新增暫存註冊資料表（驗證失敗時單純不建立 `User`，沒有需要清理的殘留狀態）。
- 操作手冊：更新 `doc/學員手冊.md`（註冊流程新增欄位說明）。
