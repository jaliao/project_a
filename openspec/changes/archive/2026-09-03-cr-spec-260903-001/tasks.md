## 1. i18n 訊息：新增 `profile` 命名空間

- [x] 1.1 `messages/zh-TW.json` 頂層新增 `profile` 物件，鍵值以 design.md D1 草擬清單為準，**繁體字面逐字複製自現有元件**（含全形括號、標點；`fieldRealName` 不含尾端 ` *`）。含子物件 `profile.toast.*`。
- [x] 1.2 `messages/zh-TW.json` `validation` 補鍵：`currentPasswordWrong`（「目前密碼不正確」）、`passwordWrong`（「密碼不正確」）、`emailSameAsCurrent`（「與目前帳號相同」）、`emailTaken`（「此 Email 已被使用」）。
- [x] 1.3 `messages/en.json` 對應補上 `profile` 命名空間與 §1.2 的 `validation.*` 鍵之**英文翻譯**（鍵結構與 zh-TW 完全一致）。
- [x] 1.4 確認未在 `messages/zh-CN.json` 手改（§9 由 `npm run gen:zh-cn` 產生）。
- [x] 1.5 `node -e "JSON.parse(require('fs').readFileSync('messages/zh-TW.json'))"` 及 en.json 皆解析通過（無語法錯）。

## 2. `page.tsx`（server component）改 `getTranslations`

檔：`app/[locale]/(user)/user/[spiritId]/profile/page.tsx`（已有 `const t = await getTranslations()`）

- [x] 2.1 `<h1>個人資料</h1>` → `{t('profile.pageTitle')}`
- [x] 2.2 `isIncomplete` 藍色橫幅文字 → `{t('profile.incompleteBanner')}`
- [x] 2.3 缺 `realName`/`phone` 橘色橫幅文字 → `{t('profile.completionHint')}`
- [x] 2.4 唯讀區「啟動事工編號」→ `{t('profile.spiritIdLabel')}`；「啟動帳號資訊」→ `{t('profile.accountInfoLabel')}`
- [x] 2.5 登入方式：改為以 `t('profile.loginMethodLabel')` + `[hasPassword && t('profile.loginMethodPassword'), google && t('profile.loginMethodGoogle')].filter(Boolean).join('、') || '—'`（分隔「、」與「—」保留字面）
- [x] 2.6 `t('language.settings')` 區塊不動；`<SignOutSection />` 由 §6 處理
- [x] 2.7 檔首註解更新日期並加一行 `cr-spec-260903-001：個人資料頁字串 i18n 化（profile 命名空間）`

## 3. `profile-form.tsx`（client）改 `useTranslations`

檔：`app/[locale]/(user)/user/[spiritId]/profile/profile-form.tsx`

- [x] 3.1 `import { useTranslations } from 'next-intl'`；元件內 `const t = useTranslations()`
- [x] 3.2 區標題「基本資料／通訊 Email／帳號連動」→ `t('profile.sectionBasic'|'sectionCommEmail'|'sectionAccountLinking')`
- [x] 3.3 欄位標籤 8 項 → `t('profile.fieldRealName')` + `' *'`、`fieldEnglishName`、`fieldNickname`、`fieldGender`、`fieldDisplayNameMode`、`fieldBirthYear`、`fieldPhone`、`fieldAddress`、`fieldChurch`
- [x] 3.4 placeholder → `placeholderEnglishName`、`placeholderNickname`、`placeholderBirthYear`（原 `例：1990（選填）`；模板字串改 key）、`placeholderPhone`、`placeholderChurchOther`
- [x] 3.5 `<option>` 顯示文字：性別 `genderMale`/`genderFemale`；顯示名稱方式 `displayModeNickname`/`displayModeNicknameZh`/`displayModeNicknameEn`；教會 `churchNone`/`churchOther`；`value` 全部不改
- [x] 3.6 「（已停用）」→ `t('profile.churchInactiveSuffix')`；「顯示名稱預覽：」→ `t('profile.displayNamePreview')`
- [x] 3.7 「儲存資料」→ `t('profile.save')`
- [x] 3.8 通訊 Email 區：徽章 `user.isCommVerified ? t('profile.commVerified') : t('profile.commUnverified')`；「更新通訊 Email」→ `t('profile.updateCommEmail')`；「重發驗證信」→ `t('profile.resendVerification')`
- [x] 3.9 帳號連動區：`isGoogleLinked ? t('profile.providerLinked') : t('profile.providerUnlinked')`；「解除連結」→ `t('profile.unlink')`；「連結帳號」→ `t('profile.link')`；LINE 區「未連結」→ `t('profile.providerUnlinked')`；「即將推出」→ `t('profile.comingSoon')`（「Google」「LINE」為專有名詞不譯）
- [x] 3.10 四處 toast：`result.success ? toast.success(t(result.message)) : toast.error(t(result.message))`（`onProfileSubmit`、`onCommEmailSubmit`、`handleResendVerification`、`handleUnlinkGoogle`）
- [x] 3.11 `<FieldError message={...} />` 用法不動（內部已 `t()`）
- [x] 3.12 檔首註解更新日期並加一行 `cr-spec-260903-001`

## 4. `change-account-card.tsx`（client）

檔：`app/[locale]/(user)/user/[spiritId]/profile/change-account-card.tsx`

- [x] 4.1 `const t = useTranslations()`
- [x] 4.2 Google-only 分支：「帳號修改」→ `t('profile.changeAccountTitle')`；說明 → `t('profile.changeAccountGoogleOnly')`
- [x] 4.3 有密碼卡：標題 `changeAccountTitle`；說明「變更登入帳號（Email）。目前帳號：」→ `t('profile.changeAccountDesc')`（`{currentEmail}` 保留）；「新帳號 Email」→ `changeAccountNewEmail`；「目前密碼」→ `changeAccountCurrentPassword`；placeholder `new@example.com` → `t('profile.placeholderNewEmail')`；「修改帳號」鈕 → `changeAccountSubmit`
- [x] 4.4 `AlertDialog`：「確認修改登入帳號？」→ `changeAccountConfirmTitle`；「目前帳號：」→ `changeAccountConfirmCurrent`；「新帳號：」→ `changeAccountConfirmNew`；「⚠️ 確認後立即生效…」→ `changeAccountConfirmWarn`；`AlertDialogCancel`「取消」→ `t('common.cancel')`；「處理中…」→ `t('profile.processing')`；「確認修改」→ `changeAccountConfirmSubmit`
- [x] 4.5 inline error：`{errors.email?.[0] && <p ...>{t(errors.email[0])}</p>}`、`{errors.currentPassword?.[0] && <p ...>{t(errors.currentPassword[0])}</p>}`
- [x] 4.6 toast：`toast.success(t(res.message ?? 'profile.toast.accountEmailUpdated'))`、`toast.error(t(res.message))`
- [x] 4.7 檔首註解加一行 `cr-spec-260903-001`

## 5. `change-password-card.tsx`（client，已有 `t`）

檔：`app/[locale]/(user)/user/[spiritId]/profile/change-password-card.tsx`

- [x] 5.1 「變更密碼」→ `t('profile.changePasswordTitle')`
- [x] 5.2 標籤「目前密碼／新密碼／確認新密碼」→ `changePasswordCurrent`/`changePasswordNew`/`changePasswordConfirm`
- [x] 5.3 placeholder「輸入目前密碼／至少 8 個字元／再次輸入新密碼」→ `changePasswordCurrentPlaceholder`/`changePasswordNewPlaceholder`/`changePasswordConfirmPlaceholder`
- [x] 5.4 按鈕「更新密碼／更新中...」→ `changePasswordSubmit`/`changePasswordSubmitting`
- [x] 5.5 `onSubmit`：`toast.success(t(result.message ?? 'profile.toast.passwordUpdated'))`；失敗分支 `errKey`（現為 `validation.currentPasswordWrong` 等）→ `toast.error(errKey ? t(errKey) : (result.message ? t(result.message) : t('profile.toast.formHasErrors')))`
- [x] 5.6 檔首註解加一行 `cr-spec-260903-001`

## 6. `sign-out-section.tsx` + `avatar-upload-section.tsx`（client）

- [x] 6.1 `components/profile/sign-out-section.tsx`：`const t = useTranslations()`；「登出」標題 → `t('profile.signOutTitle')`；「登出後將返回登入頁面。」→ `t('profile.signOutDesc')`；按鈕「登出」→ `t('profile.signOut')`；檔首註解加一行 `cr-spec-260903-001`
- [x] 6.2 `components/profile/avatar-upload-section.tsx`：`const t = useTranslations()`；「上傳新頭像」→ `t('profile.avatarUpload')`；「處理中…」→ `t('profile.processing')`；「移除頭像」→ `t('profile.avatarRemove')`；提示「支援 JPG／PNG／WebP…」→ `t('profile.avatarHint')`
- [x] 6.3 avatar toast：`toast.success(t(result.message ?? 'profile.toast.avatarUpdated'))`（上傳）／`t(result.message ?? 'profile.toast.avatarRemoved')`（移除）；`toast.error(t(result.message ?? 'profile.toast.avatarUploadFailed'))` 與移除對應 `avatarRemoveFailed`
- [x] 6.4 檔首註解加一行 `cr-spec-260903-001`

## 7. Server actions 回傳改 i18n key

- [x] 7.1 `app/actions/profile.ts` `updateProfile`：`'部分欄位填寫有誤，請檢查後再試'` → `'profile.toast.formHasErrors'`；`'個人資料已更新'` → `'profile.toast.profileUpdated'`；`'請先登入'` → `'profile.toast.mustLogin'`（schema `errors` 不動）
- [x] 7.2 `updateCommEmail`：`'通訊 Email 已更新，請查收驗證信'` → `'profile.toast.commEmailUpdated'`；`'請先登入'` → key
- [x] 7.3 `resendCommVerification`：`'尚未設定通訊 Email'`／`'通訊 Email 已驗證'`／`'驗證信已重新發送'` → `profile.toast.commEmailNotSet`／`commEmailAlreadyVerified`／`verificationResent`；`'請先登入'` → key
- [x] 7.4 `unlinkGoogleAccount`：`'尚未連結 Google 帳號'`／`'請先設定密碼再解除連結，以免無法登入'`／`'Google 帳號已解除連結'` → `profile.toast.googleNotLinked`／`googleUnlinkNeedsPassword`／`googleUnlinked`；`'請先登入'`／`'帳號不存在'` → `profile.toast.mustLogin`
- [x] 7.5 `changeMyAccountEmail`：`'Google 登入帳號請洽管理員協助修改'` → `'profile.toast.accountEmailGoogleOnly'`；`errors:{ currentPassword:['密碼不正確'] }` → `['validation.passwordWrong']`；成功訊息 `` `帳號已更新為 ${check.email}…` `` → `'profile.toast.accountEmailUpdated'`（移除內插）
- [x] 7.6 `changeMyAccountEmail`：就地加映射表把 `check.errors.email` 的三種已知繁體字面 → `validation.emailInvalid`／`validation.emailSameAsCurrent`／`validation.emailTaken`（`MAP[m] ?? m`）。**不動** `lib/account-email-change.ts`
- [x] 7.7 `app/actions/profile.ts` 內 `updateGender`／`verifyCommEmail` 等其餘函式**不動**
- [x] 7.8 `app/actions/auth.ts` **僅** `changePassword`：`'帳號不支援密碼登入'` → `'profile.toast.passwordAccountUnsupported'`；`errors:{ currentPassword:['目前密碼不正確'] }` → `['validation.currentPasswordWrong']`；`'密碼已成功更新'` → `'profile.toast.passwordUpdated'`；`'請先登入'` → `'profile.toast.mustLogin'`。`changePasswordFirstLogin`／`register`／`forgotPassword`／`resetPassword`／`onboarding*` **不動**
- [x] 7.9 `app/actions/avatar.ts` `uploadAvatar`／`removeAvatar`：`'頭像已更新'` → `'profile.toast.avatarUpdated'`；`'頭像已移除'` → `'profile.toast.avatarRemoved'`；`'請先登入'` → key；失敗鍵維持既有 `validation.avatarTypeInvalid`／`validation.avatarTooLarge`
- [x] 7.10 三個 action 檔檔首註解各加一行 `cr-spec-260903-001：個人資料頁相關 action 訊息 i18n key 化`
- [x] 7.11 grep 確認 client 端所有 `toast.*(...message...)` 與 inline error 呈現皆已包 `t()`（§3.10／4.5／4.6／5.5／6.3）

## 8. 刪除死碼

- [x] 8.1 `git rm "app/[locale]/(user)/profile/profile-form.tsx"`
- [x] 8.2 `grep -rn "(user)/profile/profile-form\|from './profile-form'" app/` 於 `app/[locale]/(user)/profile/` 範圍確認 0 引用（同層 `page.tsx` 為純轉址、不 import）
- [x] 8.3 確認 `app/[locale]/(user)/profile/page.tsx`（`ProfileRedirectPage`）未更動、`/profile` 轉址正常

## 9. 產生簡體 + 驗證

- [x] 9.1 `npm run gen:zh-cn` → 重新產生 `messages/zh-CN.json`（含 `profile` 命名空間）
- [x] 9.2 `npx eslint` 對本次改動的 8 個 .tsx/.ts 檔：0 error
- [x] 9.3 `npx tsc --noEmit`：0 error
- [x] 9.4 `npm run build`：`✓ Compiled successfully`
- [x] 9.5 **（人工實測 zh-TW）** `/user/{spiritId}/profile`：逐區文字與變更前一致；送出基本資料（成功／欄位錯誤）、更新通訊 Email、重發驗證信、Google 連結／解除、改帳號 Email（確認彈窗＋錯誤 email）、改密碼（成功／目前密碼錯）、頭像上傳／移除、登出區 —— toast 與 inline 錯誤皆正確繁體
- [x] 9.6 **（人工實測 en）** `/en/user/{spiritId}/profile`：上述所有文字與 toast／錯誤訊息皆英文；無畫面殘留中文（教會名稱等 DB 值除外）、無顯示原始 key、無破版
- [x] 9.7 **（人工實測）** `/en/profile` 轉址至 `/en/user/{spiritId}/profile` 正常

## 10. 文件與版本（rule 7／8／9）

- [x] 10.1 `config/version.json`：`version` patch +1（`0.1.197` → `0.1.198`）、`updatedAt` = `2026-09-03`
- [x] 10.2 `README-AI.md`：版本行更新為 `0.1.198`
- [x] 10.3 `ai-context/06-standards.md`：i18n 已遷移範圍補「個人資料頁（`/user/[spiritId]/profile`）及其 server action toast（`profile` 命名空間）」
- [x] 10.4 `ai-context/07-current-tasks.md`「已完成」清單最前面追加：`cr-spec-260903-001 個人資料頁英文化（profile i18n 命名空間＋相關 server action toast key 化；移除舊版 profile-form 死碼）`
- [x] 10.5 `doc/學員手冊.md`／`doc/老師手冊.md`／`doc/管理者操作手冊.md`：個人資料頁 zh-TW 呈現字面不變 → 內文不改；僅檔首版本標註與日期改 `2026-09-03`
