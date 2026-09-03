## Why

需求單 CR-SPEC-260903-001（提出人：廖柏嘉 Justin，2026-09-03，所屬專案 P26021 Project A 啟動靈人系統）：**「個人資料頁面 翻譯英文」**。

現況：個人資料頁 `/user/{spiritId}/profile` 及其子元件的 UI 文字**幾乎全部寫死繁體中文**，未接入 next-intl（見 CLAUDE.md 第 12 點）。切到 `/en` 時整頁仍是中文。

- **`app/[locale]/(user)/user/[spiritId]/profile/page.tsx`**（server component）：頁標題「個人資料」、唯讀資訊區（「啟動事工編號」「啟動帳號資訊」「登入方式：」＋「密碼登入」「Google 登入」）、兩段補填提示橫幅（`isIncomplete` 藍色橫幅、缺 `realName`/`phone` 橘色橫幅）、`<SignOutSection />`。全頁僅「語言設定」`t('language.settings')` 已 i18n。
- **`.../profile-form.tsx`**（client）：頭像 `<section>`、「基本資料」區（區標題、`realName`／`englishName`／`nickname`／`gender`／`displayNameMode`／`birthYear`／`phone`／`address`／所屬教會 各欄標籤與 placeholder、性別與顯示名稱方式下拉選項、「顯示名稱預覽：」、「無」「其他」「（已停用）」、「請填寫教會/單位名稱」、「儲存資料」鈕）、「通訊 Email」區（「已驗證」「未驗證」徽章、「更新通訊 Email」「重發驗證信」鈕）、「帳號連動」區（「已連結」「未連結」、「解除連結」「連結帳號」、「LINE」「即將推出」）。`<FieldError>` 既有機制已能 `t()` 呈現 client 端 zod 驗證 key。
- **`.../change-account-card.tsx`**（client）：Google-only 說明卡（「帳號修改」標題＋說明）、有密碼者卡（標題、說明、「新帳號 Email」「目前密碼」標籤、「修改帳號」鈕、確認 `AlertDialog` 全文「確認修改登入帳號？」「目前帳號：」「新帳號：」「⚠️ 確認後立即生效…」「取消」「處理中…」「確認修改」）；`errors.email`／`errors.currentPassword` 直接以純文字呈現。
- **`.../change-password-card.tsx`**（client）：已 `useTranslations()` 但僅用於 error key（`t(errKey)`）；標題「變更密碼」、三組密碼欄標籤（「目前密碼」「新密碼」「確認新密碼」）與 placeholder、「更新密碼」「更新中...」鈕仍寫死。
- **`components/profile/sign-out-section.tsx`**：「登出」標題、「登出後將返回登入頁面。」、「登出」鈕。
- **`components/profile/avatar-upload-section.tsx`**：「上傳新頭像」「處理中…」「移除頭像」、「支援 JPG／PNG／WebP，大小 2MB 以內」；且 `toast.error(result.message ?? …)` 未過 `t()`，而 `app/actions/avatar.ts` 已回傳 `validation.*` key（`validation.avatarTypeInvalid` 等）→ 目前實際會把**原始 key** 當 toast 顯示。

Server actions（`app/actions/profile.ts`、`app/actions/auth.ts` 的 `changePassword`、`app/actions/avatar.ts`）目前 `message` 與非 schema `errors` 皆回傳**寫死繁體**（例：「個人資料已更新」「密碼不正確」、`` `帳號已更新為 ${email}，下次登入請使用新帳號` ``）；對應 client 端 `toast.*(result.message)` 未過 `t()`。`updateProfileSchema`／`commEmailSchema`／`changePasswordSchema` 的欄位訊息本就是 `validation.*` key。

死碼：**`app/[locale]/(user)/profile/profile-form.tsx`** 為舊版表單，同層 `page.tsx` 已改為純轉址至 `/user/{spiritId}/profile`、全庫無人 import（grep 僅命中其檔首註解），未接 i18n。

## What Changes

1. **新增 `profile` i18n 命名空間**（`messages/zh-TW.json` 為唯一事實來源、`messages/en.json` 補英文、`messages/zh-CN.json` 由 `npm run gen:zh-cn` 產生）：涵蓋個人資料頁與其 6 個子元件的所有畫面文字——頁標題、區標題、欄位標籤、下拉選項、placeholder、按鈕、狀態徽章（已驗證／未驗證、已連結／未連結）、說明文字、補填提示橫幅、登入方式標籤、確認彈窗全文。`validation.*` 補少數缺鍵（`emailSameAsCurrent`、`emailTaken`）。
2. **6 個元件改以 key 取用**、不再寫死中文：server 元件（`page.tsx`）用 `getTranslations`，client 元件用 `useTranslations`。`<FieldError>` 既有用法不變。
3. **Server action toast 訊息 i18n 化**（本次範圍含 server action 層，依使用者確認）：
   - `app/actions/profile.ts`：`updateProfile`／`updateCommEmail`／`resendCommVerification`／`unlinkGoogleAccount`／`changeMyAccountEmail` 的 `message` 與非 schema `errors` 改回傳 i18n key；`changeMyAccountEmail` 成功訊息**移除 email 內插**（改「帳號已更新，下次登入請使用新帳號」／英），`check.errors`（來自 admin 共用的 `lib/account-email-change.ts`）於 **action 邊界**改對應 `validation.*` key（**不動** `lib/account-email-change.ts` 本身）。
   - `app/actions/auth.ts`：**僅** `changePassword` 的非 schema 回傳改 key（`changePasswordFirstLogin`、`register`、`forgotPassword`、`resetPassword`、`onboarding*` 等其餘一律不動）。
   - `app/actions/avatar.ts`：`uploadAvatar`／`removeAvatar` 的成功／失敗 `message` 統一為 key（失敗鍵沿用既有 `validation.*`）。
   - 對應 client：`toast.success/error(t(result.message))`；`change-account-card.tsx` 的 inline `errors.*` 改以 `t()` 呈現。
4. **刪除死碼** `app/[locale]/(user)/profile/profile-form.tsx`（無人引用；`/profile` → `/user/{spiritId}/profile` 轉址行為不變）。
5. 文件與版本（rule 7／8／9）：`config/version.json` patch +1＋`updatedAt`、`ai-context/` 對應章節、`README-AI.md` 版本行、`doc/` 三手冊檔首版本與日期（zh-TW 呈現字面**不變**，手冊內容無需改寫）。

## Impact

- **Affected specs**：**新增** `i18n-user-profile`（個人資料頁及其子元件、以及相關 server action toast 之在地化規範）。`user-profile`／`account-email-change`／`comm-email`／`account-linking`／`password-lifecycle`／`user-avatar`／`display-name`／`member-birth-year` 等既有需求（欄位組成、標籤字面、驗證規則、送出流程）**不變**——zh-TW 呈現與變更前一致。
- **Affected code**：
  - `app/[locale]/(user)/user/[spiritId]/profile/{page,profile-form,change-account-card,change-password-card}.tsx`
  - `components/profile/{sign-out-section,avatar-upload-section}.tsx`
  - `app/actions/profile.ts`（5 個函式）、`app/actions/auth.ts`（`changePassword` 一個函式）、`app/actions/avatar.ts`（`uploadAvatar`／`removeAvatar`）
  - `messages/zh-TW.json`／`messages/en.json`（新增 `profile` 命名空間、`validation.*` 補鍵）；`messages/zh-CN.json`（`npm run gen:zh-cn` 產生）
  - **刪除** `app/[locale]/(user)/profile/profile-form.tsx`
  - `config/version.json`、`ai-context/`、`README-AI.md`、`doc/`（三手冊檔首）
- **無 DB schema 變更**；純前端＋ server action 回傳字串調整，部署即生效。
- **相容性**：非預設語言缺 key 由 `i18n/request.ts` deepMerge 逐層回退繁體，遷移期間不破版、不顯示原始 key。**不動** `lib/account-email-change.ts` → admin 帳號修改（`app/actions/admin.ts`）與後台會員管理頁不受影響。
- **非目標**：不改個人資料頁的欄位組成、驗證規則、送出流程、版面與互動；不改 onboarding／recover-account／登入註冊等其他頁；不改 admin 後台字串；不改 `updateGender`（非本頁使用）；不新增語言、不改語言切換器（`LanguageSwitcher`）。
