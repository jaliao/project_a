# Design — 略過 seed 合成信箱的外寄信件

## Context

名冊 seed 匯入的純學員帳號 Email 為合成的 `{spiritId}@seed.iwillshare.org.tw`（`member-roster-seed` spec），信箱不存在。`lib/mailer.ts` 有五個寄信函式（臨時密碼、通訊 Email 驗證、密碼重設、結業信、講師授權通知），各自直接呼叫 `transporter.sendMail`。這些帳號被觸發寄信時（最常見是結業信——老師確認結業會對每位結業學員寄信）必然退信，累積退信傷害寄件網域（SPF/DKIM 已驗證）的信譽。

呼叫端多以 `resolveContactEmail(user)` 解析收件地址（優先已驗證通訊 Email、退回帳號 Email）；seed 帳號無通訊 Email 時解析結果即合成地址。

## Goals / Non-Goals

**Goals:**
- 任何寄往 `@seed.iwillshare.org.tw` 的信在送出前被統一攔下，不產生 SMTP 請求
- 略過對呼叫端透明（不拋錯、回傳如常），業務流程（結業、開帳號等）不受影響
- 未來新增信件種類自動受同一守門保護

**Non-Goals:**
- 不改 `resolveContactEmail` 解析規則（seed 帳號若驗證了真實通訊 Email，信自動恢復寄送，此行為要保留）
- 不處理其他無效地址型態（如 dev seed 的 `@test.com`——僅本機開發用，且屬測試資料非正式名冊）
- 不做退信偵測、寄送佇列或壓制清單（bounce suppression）機制

## Decisions

### 1. 守門放在 mailer 層，不放在 resolveContactEmail

`resolveContactEmail` 的職責是「選出正確收件人」且必須回傳 string；且通訊 Email 驗證信不經過它（CLAUDE.md 第 10 點例外）。在 mailer 統一攔截可涵蓋**所有**寄信路徑、呼叫端零修改。

### 2. 內部 wrapper `sendMailSafe` ＋ 匯出 helper `isUndeliverableEmail`

`lib/mailer.ts` 內：

```ts
const SYNTHETIC_EMAIL_DOMAIN = '@seed.iwillshare.org.tw'

export function isUndeliverableEmail(email: string): boolean {
  return email.trim().toLowerCase().endsWith(SYNTHETIC_EMAIL_DOMAIN)
}

async function sendMailSafe(options: nodemailer 選項) {
  const to = String(options.to ?? '')
  if (isUndeliverableEmail(to)) {
    console.info(`[mailer] 略過合成 seed 信箱，不寄送：${to}`)
    return
  }
  await transporter.sendMail(options)
}
```

五個寄信函式的 `transporter.sendMail(...)` 改為 `sendMailSafe(...)`。判定用 `endsWith`（小寫化後），大小寫不敏感、不誤傷子字串相似的正常網域（因含 `@` 前綴）。

`isUndeliverableEmail` 匯出供未來 UI 提示（如後台顯示「此會員無有效信箱」）重用；本變更不加 UI。

### 3. 略過時記 log、回傳如常

呼叫端目前對寄信失敗各有處理（結業信 catch 後僅記錯誤）。略過不是失敗——回傳 `undefined` 如常結束，僅 `console.info` 留痕跡，行為與「寄成功」對呼叫端一致，避免觸發呼叫端的錯誤分支或使用者可見的失敗訊息。

## Risks / Trade-offs

- [管理者重設 seed 帳號臨時密碼時，以為信已寄出] → 現況是信寄出後退信、同樣收不到，守門後至少不傷網域信譽；後台流程本就會直接顯示臨時密碼給管理者（既有行為），不依賴信件送達
- [`console.info` 在正式環境可能被忽略] → 此 log 僅為稽核線索，非功能依賴；未來若需可觀測性可再接正式 logger
- [網域寫死於 mailer] → 與 seed spec 的網域是同一常數語意，但 seed 在 `prisma/seed.ts`、mailer 在 `lib/`（Edge/構建邊界不同），各自持有常數、以 spec 為同步依據，可接受

## Open Questions

（無）
