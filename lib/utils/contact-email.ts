/*
 * ----------------------------------------------
 * 外寄信件收件人解析（通用規則）
 * 2026-06-21
 * lib/utils/contact-email.ts
 *
 * 通用規則：對使用者的外寄信，優先使用「已驗證的通訊 Email」，
 * 否則退回帳號 Email。
 * ⚠️ 例外：通訊 Email 驗證信本身仍寄至待驗證地址，不經此函式。
 * ----------------------------------------------
 */

export function resolveContactEmail(user: {
  email: string
  commEmail?: string | null
  isCommVerified?: boolean | null
}): string {
  if (user.isCommVerified && user.commEmail?.trim()) {
    return user.commEmail
  }
  return user.email
}
