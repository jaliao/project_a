## Context

`User` 有 `email`（登入帳號，唯一不可變）與 `commEmail` / `isCommVerified`（通訊 Email，可改、需驗證）。外寄信透過 `lib/mailer.ts` 的 `sendTempPasswordEmail` / `sendCommEmailVerification` / `sendPasswordResetEmail`，各函式收一個 `to` 參數，由呼叫端決定收件地址：
- `app/actions/auth.ts`：註冊臨時密碼信用帳號 email；密碼重設信用使用者輸入並查到的帳號 email。
- `app/actions/admin.ts`：管理者重設臨時密碼，用 `user.email`。
- `app/actions/profile.ts`：通訊 Email 驗證信，用待驗證的 `commEmail`。

無統一收件人規則。測試帳號的帳號 email 多為合成 / 不存在地址，收不到測試信。

## Goals / Non-Goals

**Goals:**
- 明確測試帳號 `commEmail = justin@blockcode.com.tw`、`isCommVerified = true`。
- 建立共用 `resolveContactEmail(user)` 並套用至所有對使用者外寄信。
- 將規則寫入 `CLAUDE.md` 供後續開發遵循。

**Non-Goals:**
- 不改 `commEmail` 驗證流程（驗證信仍寄待驗證地址）。
- 不改 mailer 傳輸層（SMTP）。
- 不為名冊大量帳號設 commEmail（僅明確測試帳號）。

## Decisions

### 決策 1：新增純函式 `resolveContactEmail(user)`
簽章 `resolveContactEmail(user: { email: string; commEmail?: string | null; isCommVerified?: boolean | null }): string`，回傳 `user.isCommVerified && user.commEmail?.trim() ? user.commEmail : user.email`。放於 `lib/utils/contact-email.ts`，純函式、無副作用、易測。
- 替代方案：在各呼叫點 inline 判斷 → 散落易不一致，否決（本變更目的即收斂為單一規則）。

### 決策 2：呼叫端負責帶出欄位並解析後再傳給 mailer
維持 mailer 函式只收 `to`（傳輸層不查 DB）。呼叫端查詢 `User` 時 SHALL select `email, commEmail, isCommVerified`，以 `resolveContactEmail()` 得收件地址。
- 套用點：`auth.ts` 註冊臨時密碼信、`auth.ts` 密碼重設信、`admin.ts` 重設臨時密碼信。
- 註冊當下使用者尚無已驗證 commEmail → 規則自然退回帳號 email，行為相容。

### 決策 3：驗證信為明文例外
`sendCommEmailVerification` 仍寄至「待驗證的 commEmail」，不經 `resolveContactEmail`。於規範與 spec 明列此例外，避免日後誤套用導致驗證信寄到舊地址而無法驗證。

### 決策 4：規則同時落為 spec 與 CLAUDE.md 規範
formal spec 置於新 capability `email-recipient-resolution`；另於 `CLAUDE.md` 新增一條「外寄信件收件人解析」通用規則，讓未來寫新寄信點時直接遵循。

### 決策 5：測試帳號 seed 以既有 upsert 一併設定
於 `prisma/seed.ts` 既有測試帳號 upsert 的 create／update 加 `commEmail: 'justin@blockcode.com.tw'`、`isCommVerified: true`。update 亦同步（與其他描述欄位一致），確保重置後即為已驗證狀態。

## Risks / Trade-offs

- [呼叫端漏帶 `commEmail`/`isCommVerified` 欄位 → 解析恆退回帳號 email] → `resolveContactEmail` 對缺欄位安全退回；套用點於 tasks 逐一列出並確認 select 帶齊。
- [密碼重設改寄已驗證 commEmail，與使用者輸入的帳號 email 不同地址] → 依使用者決定（套用到所有外寄信）；回覆訊息維持「將發送至您的信箱」不洩漏地址。
- [course-order 快照 `user.commEmail || user.email` 未檢查驗證旗標] → 屬訂單快照欄位非外寄信，本變更不納入（避免擴大範圍）；如需一致可後續處理。

## Migration Plan

無 DB schema 變更（`commEmail`/`isCommVerified` 既存欄位）。seed 重跑即生效；程式調整部署即生效。回滾＝還原 seed 與各呼叫點、移除 helper。

## Open Questions

無。
