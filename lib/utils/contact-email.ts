/*
 * ----------------------------------------------
 * 外寄信件收件人解析（通用規則）
 * 2026-06-21
 * lib/utils/contact-email.ts
 *
 * 通用規則：對使用者的外寄信，優先使用「已驗證的通訊 Email」，
 * 否則退回帳號 Email。
 * ⚠️ 例外：通訊 Email 驗證信本身仍寄至待驗證地址，不經此函式。
 * ⚠️ cr-feat-261021-004：帳號 Email 現為可選（例如僅以 LINE 登入者），
 *    兩者皆無時回傳 null，呼叫端需自行判斷「此會員無法收信」並略過寄送。
 * ----------------------------------------------
 */

export function resolveContactEmail(user: {
  email: string | null
  commEmail?: string | null
  isCommVerified?: boolean | null
}): string | null {
  if (user.isCommVerified && user.commEmail?.trim()) {
    return user.commEmail
  }
  return user.email
}
