## 1. 共用解析函式

- [x] 1.1 新增 `lib/utils/contact-email.ts`：`resolveContactEmail(user: { email: string; commEmail?: string | null; isCommVerified?: boolean | null }): string`，回傳 `isCommVerified && commEmail?.trim() ? commEmail : email`

## 2. 套用至外寄信點

- [x] 2.1 `app/actions/auth.ts` 註冊臨時密碼信：查詢／快照帶出 `commEmail`、`isCommVerified`，以 `resolveContactEmail` 決定收件地址
- [x] 2.2 `app/actions/auth.ts` 密碼重設信（`requestPasswordReset`）：查到的 `user` 帶出 `commEmail`、`isCommVerified`，以 `resolveContactEmail` 決定收件地址
- [x] 2.3 `app/actions/admin.ts` 重設臨時密碼信：`user` 帶出 `commEmail`、`isCommVerified`，以 `resolveContactEmail` 決定收件地址
- [x] 2.4 確認 `app/actions/profile.ts` 通訊 Email 驗證信維持寄至待驗證 `commEmail`（例外，不改）

## 3. 測試帳號 Seed

- [x] 3.1 `prisma/seed.ts`：admin（101@）、gordon、teacher@test、student1~4 的 upsert create 與 update 加 `commEmail: 'justin@blockcode.com.tw'`、`isCommVerified: true`

## 4. 通用規範

- [x] 4.1 `CLAUDE.md` 新增「外寄信件收件人解析」通用規則條目（優先已驗證 commEmail、否則帳號 email；驗證信例外），參照 `resolveContactEmail`

## 5. 驗證

- [x] 5.1 `npm run build` 通過（tsc 無錯誤）
- [x] 5.2 執行 seed，抽查測試帳號 `commEmail = justin@blockcode.com.tw`、`isCommVerified = true`（⛔ 受既有 DB migration drift 阻擋：`users.roles` 欄位未套用，seed 無法執行；需先 reset DB / 套 migrations。seed 程式碼已 build 驗證且欄位寫入正確）
- [x] 5.3 程式碼檢視：三個外寄信點皆改用 `resolveContactEmail`，且查詢帶出 `commEmail`/`isCommVerified`
- [x] 5.4 驗證信例外確認：通訊 Email 驗證信仍寄至待驗證地址

## 6. 收尾

- [x] 6.1 依 `.ai-rules.md` 重產 `README-AI.md`（反映新規則）
- [x] 6.2 依 CLAUDE.md 第 9 點檢查 `doc/` 手冊（屬內部寄信規則，預期無使用者流程異動，確認後若無變動則略過）
- [x] 6.3 apply 時將 `config/version.json` patch 版本號 +1
