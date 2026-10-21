## Context

`sendMailSafe()`（`lib/mailer.ts`）是所有外寄信件的單一守門函式，`MAIL_OVERRIDE_TO` 生效時目前只覆寫 `options.to`，`cc`/`bcc` 原樣傳給 `transporter.sendMail`。目前專案中沒有任何呼叫端使用 `cc`/`bcc`，此問題尚未真正發生，屬於防範未來擴充的補強。

CR-FIX-261016-001 的 `design.md` 已明確記錄「不新增環境偵測機制，以 `MAIL_OVERRIDE_TO` 變數有無設定值為唯一開關」的決策，本次延續該決策，不重新討論是否要加 runtime prod 偵測。

## Goals / Non-Goals

**Goals:**
- `MAIL_OVERRIDE_TO` 生效時，`cc`／`bcc` 收件人同樣不會收到真實信件。
- 除錯時仍能從主旨看出原始完整收件範圍（`to`/`cc`/`bcc`）。

**Non-Goals:**
- 不新增任何環境自動偵測機制（沿用 CR-FIX-261016-001 已定案的決策）。
- 不改變合成 seed 網域的略過規則、不改變覆寫信箱來源（仍為環境變數）。

## Decisions

- **覆寫生效時整段移除 `cc`／`bcc`（設為 `undefined`），而非把 `cc`/`bcc` 也改成 `MAIL_OVERRIDE_TO`。**
  理由：若 `cc`/`bcc` 也填入覆寫信箱，該信箱會在 `to`/`cc`/`bcc` 同時收到同一封信的多份副本，造成困惑；移除後只留一份，原始完整收件範圍已在主旨註記中保留，不影響除錯辨識度。

- **主旨註記格式改為 `[原收件人: {to}{; cc: {cc}}{; bcc: {bcc}}] {原主旨}`，僅在對應欄位存在時才附加該段。**
  理由：維持現有「主旨前加註」的既有慣例與格式風格一致，只在真的有 `cc`/`bcc` 時才讓主旨變長，多數信件（目前皆無 `cc`/`bcc`）主旨不受影響。

## Risks / Trade-offs

（無顯著風險，純防呆補強，目前無任何呼叫端受影響——所有既有寄信函式皆未使用 `cc`/`bcc`）

## Migration Plan

純函式內部邏輯修正，無資料庫變更、無既有呼叫端受影響：
1. 修改 `sendMailSafe()` 的覆寫分支。
2. 回退：還原該函式即可。
