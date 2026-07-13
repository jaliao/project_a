# 略過 seed 合成信箱的外寄信件（cr-spec-260713-005）

## Why

名冊 seed 匯入的純學員帳號使用合成 Email `{spiritId}@seed.iwillshare.org.tw`（如 `pa260991@seed.iwillshare.org.tw`，`member-roster-seed` spec 規定的格式），此網域信箱不存在、信必退。系統對這類帳號觸發寄信（結業信、臨時密碼、講師授權等）會產生退信與寄件網域信譽風險，應直接不寄。

## What Changes

- `lib/mailer.ts` 新增**集中式寄送守門**：收件地址屬合成 seed 網域（`@seed.iwillshare.org.tw`，大小寫不敏感）時**略過寄送**、記 log（不拋錯、不影響呼叫端流程）
- 五種既有信件（臨時密碼、通訊 Email 驗證、密碼重設、結業信、講師授權通知）全部經過此守門；未來新增信件亦自動涵蓋
- 提供可判定的 helper（如 `isUndeliverableEmail(email)`），供未來 UI 提示或其他判斷重用
- 呼叫端不需逐一修改——守門在 mailer 層統一生效

## Capabilities

### New Capabilities

- `mail-skip-synthetic`: 外寄信件對合成 seed 信箱的略過規則——mailer 層統一判定與略過，寄送結果對呼叫端等同成功（不中斷業務流程）

### Modified Capabilities

（無——`email-recipient-resolution`（`resolveContactEmail`）的解析規則不變；略過發生在 mailer 送出前，非收件人解析階段）

## Impact

- **Mailer**：`lib/mailer.ts`（新增守門 wrapper，五個寄信函式改走 wrapper）
- **不變**：`lib/utils/contact-email.ts`、各 server action 呼叫端（`admin.ts`、`account-recovery.ts`、`auth.ts`、`course-invite.ts`、`profile.ts`）
- **行為影響**：seed 學員帳號結業時不再觸發退信；若該會員日後設定並驗證真實通訊 Email，`resolveContactEmail` 會解析到真實地址、信件恢復正常寄送
- **手冊**：使用者不可見的行為，管理者手冊視需要加註；`config/version.json` patch +1
- **資料庫**：無 migration
