## Why

於 `cr-spec-261016-001`（未啟用會員補資料提醒信）測試階段發現風險：dev/test 環境的 `SMTP_HOST` 接的是正式可用的 Brevo relay（非沙盒），`lib/mailer.ts` 的 `sendMailSafe` 目前只對合成網域 `@seed.iwillshare.org.tw` 略過寄送；而 `prisma/seed.ts` 匯入的多數帳號是**真實名冊**（真實姓名、真實 email），只有少數指定測試帳號（`student1~4@test.com`、`teacher@test.com`、`gordon@test.com`、管理員）的 `commEmail` 被覆寫導向 `justin@blockcode.com.tw`。

若未來在 dev/test 環境手動或自動測試任何寄信功能時誤選到真實名冊帳號，會**真的寄出信件給真人**，造成不必要的困擾或誤導。

## What Changes

- `lib/mailer.ts` 的 `sendMailSafe` 新增**環境層級收件覆寫**：當環境變數 `MAIL_OVERRIDE_TO` 有設定值，且收件地址不屬於已略過的合成 seed 網域時，一律將實際收件地址改為該覆寫信箱（目前訂為 `justin@blockcode.com.tw`），信件主旨加註原始收件地址以便追溯，並記錄 log。
- 正式環境（host 的 `.env` 不設定 `MAIL_OVERRIDE_TO`）行為完全不變，直接寄給真實收件人。
- 合成 seed 網域（`@seed.iwillshare.org.tw`）的既有「略過不寄」行為不受影響，優先於覆寫判定（反正從未真正送達過，不需要再轉寄）。

## Capabilities

### Modified Capabilities

- `mail-skip-synthetic`：寄信守門邏輯新增「非正式環境收件覆寫」規則，與既有「合成信箱略過寄送」規則並存於同一層（`sendMailSafe`）。

## Impact

- 寄信：`lib/mailer.ts` 的 `sendMailSafe` 新增覆寫判定分支；所有既有寄信函式（`sendTempPasswordEmail`、`sendAccountMergedNotification`、`sendCommEmailVerification`、`sendPasswordResetEmail`、`sendGraduationEmail`、`sendTeacherRoleGrantedEmail`、`sendProfileReminderEmail` 等）皆透過 `sendMailSafe` 統一套用，不需逐一修改。
- 環境變數：新增 `MAIL_OVERRIDE_TO`（選填），於 dev／test host 的 `.env` 設定為 `justin@blockcode.com.tw`；正式環境 host 的 `.env` 不設定，`.env.example` 補充說明註解。
- 不影響 `cr-spec-261016-001` 的功能邏輯本身，純屬寄信層的環境安全防護，兩者可平行進行、互不依賴。
