# Design — 電話驗證支援國際號碼

## Context

`lib/schemas/profile.ts` 的 `updateProfileSchema.phone`（選填）與 `onboardingProfileSchema.phone`（必填）共用 regex `/^(09\d{8}|\+8869\d{8})$/`，僅接受台灣手機。海外會員（如 `+12025550123`）在 onboarding Step 2 被必填驗證卡死，無法完成首次登入。錯誤訊息 key `validation.phoneInvalid` 與 placeholder `profile.phonePlaceholder` 文案也只提台灣格式。

教材訂單聯絡電話（`lib/schemas/course-order.ts`）僅驗證非空，不在本變更範圍。

## Goals / Non-Goals

**Goals:**
- 台灣手機與國際 E.164 格式皆可通過驗證，兩個 schema 一致
- 錯誤訊息與 placeholder 反映新規則（含國際範例）

**Non-Goals:**
- 不做國碼下拉選單、自動正規化（如 09→+886 轉換）或號碼真實性查驗
- 不改既有資料（`phone` 欄為自由 String，無 migration）
- 不動教材訂單聯絡電話（本來就寬鬆）

## Decisions

### 1. Regex 採「台灣格式 ∪ E.164」：`/^(09\d{8}|\+[1-9]\d{7,14})$/`

- `09\d{8}`：保留台灣本地寫法（最常見輸入習慣）
- `\+[1-9]\d{7,14}`：E.164 慣例——`+` 開頭、國碼首位非 0、總長 8–15 位數字；`+8869xxxxxxxx`（12 位）與 `+12025550123`（11 位）皆涵蓋，原第二分支 `\+8869\d{8}` 被吸收
- 不接受空格、連字號等分隔符（與現行行為一致，避免衍生正規化需求）

### 2. 共用常數抽出

兩個 schema 重複同一 regex，抽為模組層常數 `PHONE_REGEX` 供兩處引用，避免日後再次出現只改一處的漂移。仍放在 `lib/schemas/profile.ts`（無其他消費者，不另立檔案）。

### 3. i18n 文案

- `validation.phoneInvalid`（zh-TW）：「請輸入有效的手機號碼（台灣 09xxxxxxxx，或國際格式如 +12025550123）」；en 對應更新
- `profile.phonePlaceholder`：「例：0912345678 或 +12025550123」；en 對應更新
- zh-CN 由 `npm run gen:zh-cn` 重新產生（prebuild 也會自動跑），不手改

## Risks / Trade-offs

- [E.164 僅驗格式，`+10000000` 這類非真實號碼也會通過] → 與現行「09 開頭即通過」同層級的形式驗證，號碼真實性本來就不在系統驗證範圍
- [台灣市話（如 02-xxxx）仍不可用本地寫法輸入] → 欄位定位是「手機號碼」；市話可用 `+8862...` 國際寫法輸入，維持欄位語意不擴張

## Open Questions

（無）
