## Context

個人資料頁的 i18n 現況（相關批次 i18n-messages／i18n-routing／i18n-member-entry／i18n-validation-messages 已封存並上線；CLAUDE.md 第 12 點為規範）：

- **`app/[locale]/(user)/user/[spiritId]/profile/page.tsx`**（server component）
  ```tsx
  const t = await getTranslations()
  // <h1>個人資料</h1>
  // isIncomplete && <div ...>請先填寫必要資料（真實姓名、手機號碼），才能繼續使用系統。</div>
  // <p>啟動事工編號</p> <p>{user.spiritId ?? '—'}</p>
  // <p>啟動帳號資訊</p> <p>{user.email}</p>
  // <p>登入方式：{[hasPassword?'密碼登入':null, google?'Google 登入':null].filter(Boolean).join('、') || '—'}</p>
  // (!realName || !phone) && <div ...>請完成個人資料填寫，以便後續課程登記與書本寄送。</div>
  // <ProfileForm .../> <ChangeAccountCard .../> {hasPassword && <ChangePasswordCard/>}
  // <p>{t('language.settings')}</p> <LanguageSwitcher/>   ← 已 i18n
  // <SignOutSection/>
  ```
- **`.../profile-form.tsx`**（`'use client'`）：`useForm` + `<FieldError message={errors.x?.message} />`（`components/ui/field-error.tsx` 內部 `t()`）。寫死字串：區標題「基本資料／通訊 Email／帳號連動」；欄位標籤「中文姓名（若無中文姓名請填上您護照上的拼音姓名） *」「英文名稱」「暱稱」「性別」「顯示名稱方式」「出生年（西元）」「手機號碼」「收件地址」「所屬教會/單位」；placeholder「English name（選填）」「最多 20 個字（選填）」「例：1990（選填）」「09xxxxxxxx」「請填寫教會/單位名稱」；`<option>`「男／女」「暱稱／暱稱（中文名稱）／暱稱（英文名稱）」「無／其他」；「（已停用）」；「顯示名稱預覽：」；「儲存資料」；通訊 Email 區「已驗證／未驗證」「更新通訊 Email」「重發驗證信」；帳號連動區「Google」「已連結／未連結」「解除連結／連結帳號」「LINE」「未連結」「即將推出」。toast：`result.success ? toast.success(result.message) : toast.error(result.message)`（`result.message` 目前為 action 寫死繁體）。
- **`.../change-account-card.tsx`**（`'use client'`）：Google-only 分支整卡文字（「帳號修改」「您目前以 Google 帳號登入（未設定密碼），如需修改登入帳號請洽管理員協助。」）；有密碼卡（「帳號修改」「變更登入帳號（Email）。目前帳號：」「新帳號 Email」「目前密碼」「修改帳號」）；`AlertDialog`（「確認修改登入帳號？」「目前帳號：」「新帳號：」「⚠️ 確認後立即生效，下次登入請使用新帳號。請務必核對新帳號拼字是否正確。」「取消」「處理中…」「確認修改」）；`{errors.email?.[0]}` / `{errors.currentPassword?.[0]}` 直接渲染；`toast.success(res.message ?? '帳號已更新')` / `toast.error(res.message)`。
- **`.../change-password-card.tsx`**（`'use client'`）：`const t = useTranslations()`，`onSubmit` 已 `toast.error(errKey ? t(errKey) : (result.message ?? '更新失敗'))`。寫死：「變更密碼」「目前密碼」「輸入目前密碼」「新密碼」「至少 8 個字元」「確認新密碼」「再次輸入新密碼」「更新密碼」「更新中...」，及 `toast.success(result.message ?? '密碼已更新')`。
- **`components/profile/sign-out-section.tsx`**（`'use client'`）：「登出」「登出後將返回登入頁面。」「登出」。
- **`components/profile/avatar-upload-section.tsx`**（`'use client'`）：「上傳新頭像」「處理中…」「移除頭像」「支援 JPG／PNG／WebP，大小 2MB 以內」；toast 直接用 `result.message`（未 `t()`），而 `app/actions/avatar.ts` 失敗時已回傳 `'validation.avatarTypeInvalid'` / `'validation.avatarTooLarge'` key、成功回傳「頭像已更新」「頭像已移除」。

- **Server actions**
  ```ts
  // app/actions/profile.ts
  updateProfile → { success:false, message:'部分欄位填寫有誤，請檢查後再試', errors: <validation.* keys> }
               → { success:true,  message:'個人資料已更新' }
  updateCommEmail → { success:false, errors:<validation.* keys> } / { success:true, message:'通訊 Email 已更新，請查收驗證信' }
  resendCommVerification → message: '尚未設定通訊 Email' | '通訊 Email 已驗證' | '驗證信已重新發送'
  unlinkGoogleAccount → message: '尚未連結 Google 帳號' | '請先設定密碼再解除連結，以免無法登入' | 'Google 帳號已解除連結'
  changeMyAccountEmail → message:'Google 登入帳號請洽管理員協助修改'
                       → errors:{ currentPassword:['密碼不正確'] }
                       → errors: check.errors  // validateNewAccountEmail：{ email:['Email 格式不正確' | '與目前帳號相同' | '此 Email 已被使用'] }
                       → { success:true, message:`帳號已更新為 ${check.email}，下次登入請使用新帳號` }
  // 各 action 皆有 { success:false, message:'請先登入' }（layout 已擋，實務極少觸發）
  // app/actions/auth.ts
  changePassword → message:'帳號不支援密碼登入' | errors:{ currentPassword:['目前密碼不正確'] } | { success:true, message:'密碼已成功更新' }
  // app/actions/avatar.ts
  uploadAvatar/removeAvatar → message: 'validation.avatarTypeInvalid' | 'validation.avatarTooLarge' | '頭像已更新' | '頭像已移除' | '上傳／移除失敗…'
  ```
  `updateProfileSchema` / `commEmailSchema` / `changePasswordSchema` 的欄位訊息本就是 `validation.*` key。`lib/account-email-change.ts` `validateNewAccountEmail` 由 `app/actions/profile.ts`（本人）與 `app/actions/admin.ts:346`（管理者）共用。

- **`i18n/request.ts`**：`deepMerge(zh-TW, <locale>)` → 非預設語言缺 key 逐層回退繁體。`messages/zh-TW.json` 為唯一事實來源，`messages/zh-CN.json` 由 `scripts/gen-zh-cn.mjs`（`npm run gen:zh-cn`，`prebuild` 自動跑）產生。現有命名空間含 `common`(11)／`nav`／`auth`／`account`／`onboarding`(35)／`language`／`validation`(45)／`role`／`status` 等。

- **死碼**：`app/[locale]/(user)/profile/profile-form.tsx`（舊版表單，欄位少 `birthYear`、`<FieldError>` 未導入）。同層 `page.tsx` 為 `ProfileRedirectPage`：`session.user.spiritId` 有值 → `redirect('/user/{spiritId}/profile')`，否則 `redirect('/profile')`。全庫 grep `(user)/profile/profile-form`：0 引用（僅檔首註解命中）。

## Goals / Non-Goals

**Goals**
1. 個人資料頁（`page.tsx`）與 6 個子元件的所有畫面文字改以 `profile` i18n 命名空間取用，切 `/en` 時整頁英文；缺 key 回退繁體、不顯示原始 key、不破版。
2. 個人資料頁使用到的 server action（`profile.ts` 5 個、`auth.ts` `changePassword`、`avatar.ts` 2 個）之 `message` 與非 schema `errors` 改回傳 i18n key，client toast 以 `t()` 呈現，隨語言切換。
3. zh-TW 呈現字面與變更前**逐字一致**（`user-profile` 等既有規格對標籤文字的要求不受影響）。
4. 移除死碼 `app/[locale]/(user)/profile/profile-form.tsx`。

**Non-Goals**
- 不改個人資料頁的欄位組成、zod 驗證規則、送出／`revalidatePath` 流程、版面與互動、`<FieldError>` 機制。
- 不改 `lib/account-email-change.ts`（admin 共用）、`app/actions/admin.ts`、後台會員管理頁字串（第 12 點：後台本階段維持繁體）。
- 不改 `changePasswordFirstLogin`、`register`、`forgotPassword`、`resetPassword`、`onboarding*` 等其餘 action。
- 不改 `updateGender`（`profile.ts` 內，但個人資料頁未使用）、`verifyCommEmail`（信件驗證流程，不在頁面）。
- 不新增語言、不改 `LanguageSwitcher`／`i18n/routing.ts`。
- 不重寫 `doc/` 手冊內文（zh-TW 字面不變）；僅依 rule 9 更新檔首版本／日期。

## Decisions

### D1 — 新增 `profile` i18n 命名空間（單層扁平 + 少量分組）

`messages/zh-TW.json` 新增頂層 `profile`，比照 `onboarding`／`supportInquiry` 的組織方式（多為扁平鍵，語意群組才用巢狀物件）。鍵值以**現有繁體字面**填入（逐字複製，含全形括號與 `*`）。`messages/en.json` 同步補對應英文。草擬鍵：

```jsonc
"profile": {
  "pageTitle": "個人資料",
  "incompleteBanner": "請先填寫必要資料（真實姓名、手機號碼），才能繼續使用系統。",
  "completionHint": "請完成個人資料填寫，以便後續課程登記與書本寄送。",
  "spiritIdLabel": "啟動事工編號",
  "accountInfoLabel": "啟動帳號資訊",
  "loginMethodLabel": "登入方式：",
  "loginMethodPassword": "密碼登入",
  "loginMethodGoogle": "Google 登入",

  "sectionBasic": "基本資料",
  "sectionCommEmail": "通訊 Email",
  "sectionAccountLinking": "帳號連動",

  "fieldRealName": "中文姓名（若無中文姓名請填上您護照上的拼音姓名）",   // 呈現端自行接 " *"
  "fieldEnglishName": "英文名稱",
  "fieldNickname": "暱稱",
  "fieldGender": "性別",
  "fieldDisplayNameMode": "顯示名稱方式",
  "fieldBirthYear": "出生年（西元）",
  "fieldPhone": "手機號碼",
  "fieldAddress": "收件地址",
  "fieldChurch": "所屬教會/單位",

  "placeholderEnglishName": "English name（選填）",
  "placeholderNickname": "最多 20 個字（選填）",
  "placeholderBirthYear": "例：1990（選填）",
  "placeholderPhone": "09xxxxxxxx",
  "placeholderChurchOther": "請填寫教會/單位名稱",
  "placeholderNewEmail": "new@example.com",

  "genderMale": "男",
  "genderFemale": "女",
  "displayModeNickname": "暱稱",
  "displayModeNicknameZh": "暱稱（中文名稱）",
  "displayModeNicknameEn": "暱稱（英文名稱）",
  "displayNamePreview": "顯示名稱預覽：",

  "churchNone": "無",
  "churchOther": "其他",
  "churchInactiveSuffix": "（已停用）",

  "save": "儲存資料",

  "commVerified": "已驗證",
  "commUnverified": "未驗證",
  "updateCommEmail": "更新通訊 Email",
  "resendVerification": "重發驗證信",

  "providerLinked": "已連結",
  "providerUnlinked": "未連結",
  "unlink": "解除連結",
  "link": "連結帳號",
  "comingSoon": "即將推出",

  "changeAccountTitle": "帳號修改",
  "changeAccountGoogleOnly": "您目前以 Google 帳號登入（未設定密碼），如需修改登入帳號請洽管理員協助。",
  "changeAccountDesc": "變更登入帳號（Email）。目前帳號：",
  "changeAccountNewEmail": "新帳號 Email",
  "changeAccountCurrentPassword": "目前密碼",
  "changeAccountSubmit": "修改帳號",
  "changeAccountConfirmTitle": "確認修改登入帳號？",
  "changeAccountConfirmCurrent": "目前帳號：",
  "changeAccountConfirmNew": "新帳號：",
  "changeAccountConfirmWarn": "⚠️ 確認後立即生效，下次登入請使用新帳號。請務必核對新帳號拼字是否正確。",
  "changeAccountConfirmSubmit": "確認修改",

  "changePasswordTitle": "變更密碼",
  "changePasswordCurrent": "目前密碼",
  "changePasswordCurrentPlaceholder": "輸入目前密碼",
  "changePasswordNew": "新密碼",
  "changePasswordNewPlaceholder": "至少 8 個字元",
  "changePasswordConfirm": "確認新密碼",
  "changePasswordConfirmPlaceholder": "再次輸入新密碼",
  "changePasswordSubmit": "更新密碼",
  "changePasswordSubmitting": "更新中...",

  "avatarUpload": "上傳新頭像",
  "avatarRemove": "移除頭像",
  "avatarHint": "支援 JPG／PNG／WebP，大小 2MB 以內",

  "signOutTitle": "登出",
  "signOutDesc": "登出後將返回登入頁面。",
  "signOut": "登出",

  "processing": "處理中…",

  "toast": {
    "profileUpdated": "個人資料已更新",
    "formHasErrors": "部分欄位填寫有誤，請檢查後再試",
    "commEmailUpdated": "通訊 Email 已更新，請查收驗證信",
    "commEmailNotSet": "尚未設定通訊 Email",
    "commEmailAlreadyVerified": "通訊 Email 已驗證",
    "verificationResent": "驗證信已重新發送",
    "googleNotLinked": "尚未連結 Google 帳號",
    "googleUnlinkNeedsPassword": "請先設定密碼再解除連結，以免無法登入",
    "googleUnlinked": "Google 帳號已解除連結",
    "accountEmailGoogleOnly": "Google 登入帳號請洽管理員協助修改",
    "accountEmailUpdated": "帳號已更新，下次登入請使用新帳號",
    "passwordUpdated": "密碼已成功更新",
    "passwordAccountUnsupported": "帳號不支援密碼登入",
    "avatarUpdated": "頭像已更新",
    "avatarRemoved": "頭像已移除",
    "avatarUploadFailed": "上傳失敗，請稍後再試",
    "avatarRemoveFailed": "移除失敗，請稍後再試",
    "mustLogin": "請先登入"
  }
}
```

`validation.*` 補鍵：`"currentPasswordWrong": "目前密碼不正確"`（`changePassword` 用）、`"passwordWrong": "密碼不正確"`（`changeMyAccountEmail` 用）、`"emailSameAsCurrent": "與目前帳號相同"`、`"emailTaken": "此 Email 已被使用"`。`Email 格式不正確` → 沿用既有 `validation.emailInvalid`。

> 實作時鍵名可微調，但**命名空間 `profile`**、**扁平為主**、**zh-TW 逐字複製**三原則不變。

### D2 — `page.tsx`（server）改 `getTranslations`

已有 `const t = await getTranslations()`。將 `<h1>`、兩段橫幅、唯讀區標籤、登入方式字串改 `t('profile.*')`。

登入方式組字：現為 `[...].filter(Boolean).join('、') || '—'`。改為
```tsx
const methods = [
  hasPassword ? t('profile.loginMethodPassword') : null,
  linkedProviders.includes('google') ? t('profile.loginMethodGoogle') : null,
].filter(Boolean)
// {t('profile.loginMethodLabel')}{methods.join('、') || '—'}
```
分隔符「、」與佔位符「—」保留字面（非語言相依標點，且 en 讀起來仍可）。若要更精緻可日後加 `Intl.ListFormat`，本批不做。

`realName` 標籤：`{t('profile.fieldRealName')} *`（`*` 在 JSX 側串接，維持既有「文字 + 空格 + *」）。

### D3 — client 元件改 `useTranslations`

`profile-form.tsx`／`change-account-card.tsx`／`sign-out-section.tsx`／`avatar-upload-section.tsx` 加 `const t = useTranslations()`（`change-password-card.tsx` 已有）。逐一把寫死字串換 `t('profile.*')`。

- **下拉 `<option>`**：`<option value="male">{t('profile.genderMale')}</option>` 等；`value` 不變（送出值仍 `male`/`female`/`nickname…`）。
- **教會清單**：`{c.name}{!c.isActive ? t('profile.churchInactiveSuffix') : ''}` — `c.name` 為 DB 資料不譯。
- **徽章**：`user.isCommVerified ? t('profile.commVerified') : t('profile.commUnverified')`。
- **`isPending` 態按鈕字**：`{isPending ? t('profile.processing') : t('profile.save')}` 等（原本部分按鈕在 pending 時不換字，維持原行為即可，只譯靜態字；`change-account-card` 的「處理中…」「確認修改」「取消」→ `t('profile.processing')`／`t('profile.changeAccountConfirmSubmit')`／`t('common.cancel')`）。
- **`common.cancel`**（「取消」）已存在，`AlertDialogCancel` 用它；其餘一律 `profile.*`。

### D4 — server action 回傳改 key + client toast `t()`

**原則**：action 回傳的 `message`／非 schema `errors` 值一律換成 i18n key 字串；schema 產生的 `errors`（已是 `validation.*` key）不動；client 端所有 `toast.success(x)` / `toast.error(x)` / inline error 呈現一律包 `t(x)`。

- **`app/actions/profile.ts`**
  - `updateProfile`：`message:'部分欄位填寫有誤…'` → `'profile.toast.formHasErrors'`；`'個人資料已更新'` → `'profile.toast.profileUpdated'`；`'請先登入'` → `'profile.toast.mustLogin'`。
  - `updateCommEmail`：`'通訊 Email 已更新…'` → `'profile.toast.commEmailUpdated'`；登入檢查同上。
  - `resendCommVerification`：三訊息 → `profile.toast.commEmailNotSet` / `commEmailAlreadyVerified` / `verificationResent`。
  - `unlinkGoogleAccount`：→ `profile.toast.googleNotLinked` / `googleUnlinkNeedsPassword` / `googleUnlinked`；`'帳號不存在'` 這類理論分支也一併給 key（可複用 `profile.toast.mustLogin` 或新增 `accountNotFound`，實作決定）。
  - `changeMyAccountEmail`：
    - `'Google 登入帳號請洽管理員協助修改'` → `'profile.toast.accountEmailGoogleOnly'`
    - `errors:{ currentPassword:['密碼不正確'] }` → `['validation.passwordWrong']`
    - `check.errors`：於 action 內把 `check.errors.email` 的值**映射**成 key —
      ```ts
      const MAP: Record<string,string> = {
        'Email 格式不正確': 'validation.emailInvalid',
        '與目前帳號相同': 'validation.emailSameAsCurrent',
        '此 Email 已被使用': 'validation.emailTaken',
      }
      const errors = { email: (check.errors.email ?? []).map(m => MAP[m] ?? m) }
      ```
      （不動 `lib/account-email-change.ts`；映射表就近放 `profile.ts`。）
    - 成功：`` `帳號已更新為 ${check.email}，下次登入請使用新帳號` `` → `'profile.toast.accountEmailUpdated'`（**移除 email 內插**；新 email 於表單已可見，且成功後 `router.refresh()`）。
- **`app/actions/auth.ts` `changePassword`（僅此函式）**
  - `'帳號不支援密碼登入'` → `'profile.toast.passwordAccountUnsupported'`
  - `errors:{ currentPassword:['目前密碼不正確'] }` → `['validation.currentPasswordWrong']`
  - `'密碼已成功更新'` → `'profile.toast.passwordUpdated'`
  - `'請先登入'` → `'profile.toast.mustLogin'`
  - `changePasswordFirstLogin`（行 92–130）**不動**——其重複字面保留繁體。
- **`app/actions/avatar.ts`**
  - `'頭像已更新'` → `'profile.toast.avatarUpdated'`；`'頭像已移除'` → `'profile.toast.avatarRemoved'`；失敗訊息（目前 `'上傳失敗…'`／`'移除失敗…'` 出現在 client fallback，action 內為 `validation.avatar*`）→ action 維持 `validation.avatarTypeInvalid`／`validation.avatarTooLarge`；client fallback 字串改 `t('profile.toast.avatarUploadFailed')`／`avatarRemoveFailed`。`'請先登入'` → `'profile.toast.mustLogin'`。

- **client 對應**
  - `profile-form.tsx`：`result.success ? toast.success(t(result.message)) : toast.error(t(result.message))`（四處：profile／commEmail／resend／unlink）。
  - `change-account-card.tsx`：`toast.success(t(res.message ?? 'profile.toast.accountEmailUpdated'))`／`toast.error(t(res.message))`；inline `{errors.email?.[0] && <p>{t(errors.email[0])}</p>}`、`{errors.currentPassword?.[0] && <p>{t(errors.currentPassword[0])}</p>}`。
  - `change-password-card.tsx`：`onSubmit` 內 `toast.success(t(result.message ?? 'profile.toast.passwordUpdated'))`；既有 `errKey ? t(errKey) : (result.message ? t(result.message) : t('profile.toast.updateFailed'))`（`errKey` 現在會是 `validation.currentPasswordWrong` 等）。
  - `avatar-upload-section.tsx`：`toast.success(t(result.message ?? 'profile.toast.avatarUpdated'))`／`toast.error(t(result.message ?? 'profile.toast.avatarUploadFailed'))`（上傳）與移除對應鍵。

> `ActionResponse` 型別不變（`message?: string`）——只是語意由「繁體文案」轉為「i18n key」，與 CLAUDE.md 第 12 點「server action 回傳的 `errors` 為 key」一致；本批把 `message` 也一併 key 化（限個人資料頁範圍）。

### D5 — 刪除死碼

`git rm app/[locale]/(user)/profile/profile-form.tsx`。同層 `page.tsx`（`ProfileRedirectPage`）不動——它不 import 該檔。apply 時再次 `grep -rn "add-friend\|profile-form" app/[locale]/(user)/profile` 及 `grep -rn "(user)/profile/profile-form"` 確認 0 引用。

### D6 — zh-CN 與文件、版本（於 /opsx:apply 執行）

- `npm run gen:zh-cn` 重新產生 `messages/zh-CN.json`（`profile` 命名空間 OpenCC 轉簡體）；不得手改簡體檔。
- `config/version.json`：`version` patch +1（`0.1.197` → `0.1.198`）、`updatedAt` = `2026-09-03`。
- `ai-context/`：`06-standards.md`（若列 i18n 已遷移範圍）補「個人資料頁及其 server action toast」；`07-current-tasks.md`「已完成」最前面追加本 CR 一行。`README-AI.md` 版本行更新為 `0.1.198`。
- `doc/` 三手冊：個人資料頁 zh-TW 字面不變 → 內文不改；僅檔首版本標註與日期改 `2026-09-03`（rule 9）。

## Risks / Trade-offs

- **漏字回退繁體**：某鍵忘了加進 `en.json` → 該處顯示繁體（deepMerge 回退），非破版、非顯示 key。apply 的人工實測（逐區對照 `/en` 與 `/`）為主要防線。
- **`join('、')` 分隔符未在地化**：登入方式以「、」串接，en 下略顯突兀但可讀；`Intl.ListFormat` 留待日後，避免本批擴散。
- **`change-account-card` inline error 來源多樣**：`errors.email` 可能來自 schema formErrors（`validateNewAccountEmail` 的 `emailSchema`）或唯一性檢查；D4 的映射表涵蓋三種已知字面，未知字面 `MAP[m] ?? m` 原樣傳出 → 最壞情況顯示原字（繁體），不致破版。
- **`avatar.ts` 現況已回傳 key 但 client 未 `t()`**：本批同時修正兩端，屬既有 bug 順帶修好；風險低。
- **共用 action 誤改**：`profile.ts` 有 `updateGender`、`auth.ts` 有 `changePasswordFirstLogin` 等**不在範圍**的函式含相同字面。tasks 明列「僅改指定函式」，apply 時逐函式比對，勿全檔 replace-all。
- **手冊**：其他 CR 若正編修同檔檔首，rebase 時留意版本號行衝突（慣例）。

## Migration Plan

1. `messages/zh-TW.json` 加 `profile` 命名空間與 `validation.*` 補鍵 → `messages/en.json` 補對應英文。
2. `page.tsx` server 端改 `t('profile.*')`。
3. `profile-form.tsx`、`change-account-card.tsx`、`change-password-card.tsx`、`sign-out-section.tsx`、`avatar-upload-section.tsx` client 端改 `t('profile.*')` / `common.cancel`。
4. `app/actions/profile.ts`（5 函式）、`app/actions/auth.ts`（`changePassword`）、`app/actions/avatar.ts`（2 函式）回傳改 key；上述 client toast／inline error 包 `t()`。
5. `git rm app/[locale]/(user)/profile/profile-form.tsx`；grep 確認無引用。
6. `npm run gen:zh-cn`。
7. `npx eslint <改動檔>`、`npx tsc --noEmit`、`npm run build`。
8. 人工實測：`/user/{spiritId}/profile` 與 `/en/user/{spiritId}/profile` 逐區對照（含表單送出成功／失敗 toast、通訊 Email 重發、Google 連結／解除、改帳號 email 確認彈窗與錯誤、改密碼、頭像上傳／移除、登出區）。
9. `config/version.json`、`ai-context/`、`README-AI.md`、`doc/` 三手冊檔首（rule 7／8／9）。
10. 無 DB migration；部署即生效。回滾＝還原上述檔案（含 `profile-form.tsx` 復原）。

## Open Questions

無。範圍已與需求提出人確認：**畫面文字 + Server Action toast 一起英文化**（含 `app/actions/profile.ts`、`app/actions/auth.ts:changePassword`、`app/actions/avatar.ts`），不含 admin 共用邏輯與其他頁面。
