# 電話驗證支援國際號碼（cr-spec-260713-004）

## Why

個人資料與首次登入（onboarding）的手機號碼驗證只接受台灣格式（`09xxxxxxxx` / `+8869xxxxxxxx`），海外會員的號碼（如美國 `+12025550123`）被擋下，導致 onboarding Step 2 為必填而**無法完成首次登入流程**。

## What Changes

- 電話驗證 regex 放寬為「台灣手機 **或** E.164 國際格式」：`09xxxxxxxx` 或 `+` 開頭、國碼首位 1–9、共 8–15 位數字（涵蓋 `+8869xxxxxxxx` 與 `+12025550123`）
  - `lib/schemas/profile.ts`：`updateProfileSchema.phone` 與 `onboardingProfileSchema.phone` 兩處
- i18n 訊息更新（`validation.phoneInvalid`、`profile.phonePlaceholder` 等）：說明接受台灣或國際格式，附國際範例；繁體來源改後補英文，簡體重新產生
- 不改資料庫（`phone` 為 String，無格式約束）、不做號碼正規化或國碼下拉選單——維持單一文字欄位

## Capabilities

### New Capabilities

- `phone-validation`: 電話欄位共用驗證規則——接受台灣手機格式或 E.164 國際格式，個人資料與 onboarding 表單一體適用

### Modified Capabilities

（無——`onboarding-wizard` 與 `user-profile` 等既有 spec 未明文規定電話格式，僅要求必填/選填，行為不變；格式規則以新 capability 承載）

## Impact

- **Schemas**：`lib/schemas/profile.ts`（兩個 schema 的 phone regex）
- **i18n**：`messages/zh-TW.json`、`messages/en.json`（`validation.phoneInvalid`、`profile.phonePlaceholder`）；`zh-CN` 由 `npm run gen:zh-cn` 重新產生
- **不受影響**：`course-order` 的聯絡電話僅驗證非空（`min(1)`），本來就可填國際號碼；DB schema 無變更
- **手冊**：學員手冊／老師手冊若有描述手機格式需同步；`config/version.json` patch +1
