## Why

兩個需求：
1. 測試時，系統外寄信（臨時密碼、密碼重設等）會寄到各測試帳號的帳號 Email（多為合成 / 不存在地址），收不到信、不便驗證。將明確測試帳號的通訊 Email 統一設為 `justin@blockcode.com.tw` 且標記已驗證，測試信即可集中收取。
2. 目前各寄信點各自決定收件地址，缺乏一致規則。應建立通用規則：**外寄給使用者的信，一律優先使用「已驗證的通訊 Email」，否則退回帳號 Email**，避免散落與不一致。

## What Changes

- **Seed**：明確測試帳號（`101@iwillshare.org.tw`、`gordon@test.com`、`teacher@test.com`、`student1~4@test.com`）的 `commEmail` 設為 `justin@blockcode.com.tw`、`isCommVerified = true`。
- **通用規則（新）**：新增共用收件人解析 `resolveContactEmail(user)` —— 回傳「`isCommVerified && commEmail` → commEmail，否則 `email`」。所有對使用者的外寄信 SHALL 透過此規則決定收件地址。
- 套用至：臨時密碼信（註冊、管理者重設）、密碼重設信。
- **例外**：通訊 Email 驗證信本身仍寄至「待驗證的 commEmail」（否則無法完成驗證），不套用此規則。
- 將此規則寫入專案通用規範（`CLAUDE.md`）供後續開發遵循。

## Capabilities

### New Capabilities
- `email-recipient-resolution`: 外寄信件收件人解析通用規則 —— 優先已驗證通訊 Email、否則帳號 Email；含驗證信例外。

### Modified Capabilities
- `seed-test-accounts`: 明確測試帳號新增 `commEmail = justin@blockcode.com.tw`、`isCommVerified = true`，使測試外寄信集中至該信箱。

## Impact

- `prisma/seed.ts`：admin / gordon / teacher@test / student1~4 upsert 加 `commEmail`、`isCommVerified`。
- `lib/`：新增 `resolveContactEmail(user)` 共用函式（如 `lib/utils/contact-email.ts`）。
- `app/actions/auth.ts`（註冊臨時密碼信、密碼重設信）、`app/actions/admin.ts`（重設臨時密碼信）改用 `resolveContactEmail` 取得收件地址（需確保查詢帶出 `commEmail`、`isCommVerified`）。
- `app/actions/profile.ts`：通訊 Email 驗證信維持寄至待驗證地址（例外，不變）。
- `CLAUDE.md`：新增「外寄信件收件人解析」通用規則條目。
- `config/version.json` patch +1；依規範重產 `README-AI.md`；依 CLAUDE.md 第 9 點檢查手冊（屬內部寄信規則，預期無使用者流程異動）。
