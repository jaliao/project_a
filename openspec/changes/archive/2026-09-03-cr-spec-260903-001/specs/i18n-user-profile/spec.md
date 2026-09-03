# i18n-user-profile Delta（cr-spec-260903-001）

## ADDED Requirements

### Requirement: 個人資料頁 UI 文案在地化

個人資料頁 `/user/{spiritId}/profile` 及其子元件（`page.tsx`、`profile-form.tsx`、`change-account-card.tsx`、`change-password-card.tsx`、`components/profile/sign-out-section.tsx`、`components/profile/avatar-upload-section.tsx`）的所有 UI 文案——頁標題、區塊標題、欄位標籤、下拉選項顯示文字、placeholder、按鈕、狀態徽章（已驗證／未驗證、已連結／未連結）、補填提示橫幅、登入方式標籤、確認彈窗全文、登出區文案、頭像區文案——SHALL 以 i18n 命名空間（`profile.*`，通用詞得複用 `common.*`）取用、隨當前語言呈現，SHALL NOT 寫死語言字串。server component（`page.tsx`）SHALL 用 `getTranslations`，client component SHALL 用 `useTranslations`。

下拉選單 `<option>` 的 `value`、送出流程、zod 驗證規則、`<FieldError>` 呈現機制 SHALL NOT 因此變更。DB 來源資料（教會名稱、Email、啟動編號等）SHALL NOT 被翻譯。

預設語言（zh-TW）的呈現字面 SHALL 與本變更前**逐字一致**（含全形括號、必填標記 `*` 與既有標點）；`user-profile` 等既有規格對特定欄位標籤文字的要求 SHALL continue to hold。

#### Scenario: 以英文語言開啟個人資料頁

- **WHEN** 使用者以 `/en/user/{spiritId}/profile` 開啟自己的個人資料頁
- **THEN** 頁標題、唯讀資訊區標籤、各區塊標題、欄位標籤與 placeholder、性別／顯示名稱方式下拉選項、通訊 Email 與帳號連動的徽章與按鈕、帳號修改卡與其確認彈窗、變更密碼卡、登出區、頭像區文字 SHALL 以英文呈現

#### Scenario: 預設語言呈現不變

- **WHEN** 使用者以預設語言（zh-TW）開啟個人資料頁
- **THEN** 所有文字與本變更前逐字相同；中文姓名欄位標籤仍為「中文姓名（若無中文姓名請填上您護照上的拼音姓名）」並帶必填標記

#### Scenario: 缺 key 回退繁體

- **WHEN** 非預設語言下某個 `profile.*` key 尚未於該語言訊息檔提供
- **THEN** 該處回退顯示繁體，SHALL NOT 顯示原始 key、SHALL NOT 破版

#### Scenario: 下拉選項 value 不受在地化影響

- **WHEN** 使用者在任一語言下於性別或顯示名稱方式下拉選擇並送出個人資料表單
- **THEN** 送出的欄位值仍為既有代碼（`male`／`female`、`nickname`／`nickname_zh`／`nickname_en`），驗證與儲存行為與變更前一致

### Requirement: 個人資料頁 server action 訊息以 i18n key 回傳

個人資料頁使用到的 server action——`app/actions/profile.ts` 的 `updateProfile`／`updateCommEmail`／`resendCommVerification`／`unlinkGoogleAccount`／`changeMyAccountEmail`、`app/actions/auth.ts` 的 `changePassword`、`app/actions/avatar.ts` 的 `uploadAvatar`／`removeAvatar`——其回傳的 `message` 與非 schema 產生的 `errors` 值 SHALL 為 i18n key 字串（`profile.toast.*` 或 `validation.*`）。呼叫端 client 元件 SHALL 以 `t()` 翻譯後再交給 toast 或 inline 錯誤呈現。

`changeMyAccountEmail` 的成功訊息 SHALL NOT 內插動態 Email（改為固定字串 key）。schema（`updateProfileSchema`／`commEmailSchema`／`changePasswordSchema`）產生的欄位 `errors` 維持既有 `validation.*` key、不變。此需求 SHALL NOT 修改 admin 共用的 `lib/account-email-change.ts` 與 `app/actions/admin.ts`，亦 SHALL NOT 變更 `changePasswordFirstLogin` 等不屬個人資料頁的 action。

#### Scenario: 更新個人資料的成功 toast 隨語言

- **WHEN** 使用者於 `/en` 的個人資料頁送出「基本資料」表單且更新成功
- **THEN** toast 以英文顯示成功訊息；於 zh-TW 則顯示「個人資料已更新」

#### Scenario: 目前密碼錯誤的錯誤訊息隨語言

- **WHEN** 使用者於變更密碼卡輸入錯誤的目前密碼並送出
- **THEN** 錯誤訊息依當前語言呈現（zh-TW：「目前密碼不正確」；en：對應英文），不顯示原始 key

#### Scenario: 帳號 Email 變更的欄位錯誤隨語言

- **WHEN** 使用者於帳號修改卡輸入已被占用或與現用相同的 Email 並送出
- **THEN** 欄位下方錯誤訊息依當前語言呈現；成功時的 toast 為不含 Email 的固定訊息

#### Scenario: 頭像上傳失敗訊息可正確翻譯

- **WHEN** 使用者選擇不支援的檔案格式或過大的圖片上傳頭像
- **THEN** toast 以當前語言顯示對應錯誤（`validation.avatarTypeInvalid`／`validation.avatarTooLarge` 經 `t()`），SHALL NOT 顯示原始 key

#### Scenario: 後台帳號修改不受影響

- **WHEN** 管理者於後台會員管理修改某會員的登入 Email
- **THEN** 其行為與訊息呈現與本變更前一致（`lib/account-email-change.ts` 未更動）

### Requirement: 舊版個人資料表單死碼移除

`app/[locale]/(user)/profile/profile-form.tsx`（舊版個人資料表單）SHALL 自程式庫移除。`/profile` 路徑 SHALL 維持既有行為：`app/[locale]/(user)/profile/page.tsx` 於使用者有 `spiritId` 時轉址至 `/user/{spiritId}/profile`。移除後全庫 SHALL NOT 存在對該檔的 import。

#### Scenario: 存取 /profile 仍正確轉址

- **WHEN** 已登入且具 `spiritId` 的使用者存取 `/profile`
- **THEN** 被轉址至 `/user/{spiritId}/profile`，頁面正常顯示

#### Scenario: 無殘留引用

- **WHEN** 於程式庫搜尋 `(user)/profile/profile-form`
- **THEN** 除已刪除檔案外無任何 import 或參照
