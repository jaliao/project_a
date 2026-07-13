/*
 * ----------------------------------------------
 * Email 寄信工具（Nodemailer + SMTP）
 * 2026-03-23 (Updated: 2026-07-13)
 * lib/mailer.ts
 * ----------------------------------------------
 */

import nodemailer from 'nodemailer'

// SMTP 傳輸器（單例）
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT ?? 587),
  secure: process.env.SMTP_PORT === '465',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

// FROM 需為 SMTP 服務商已完成寄件網域驗證（SPF/DKIM）的地址，未設定時退回 SMTP_USER
const FROM_ADDRESS = `"啟動事工" <${process.env.SMTP_FROM ?? process.env.SMTP_USER}>`

// 名冊 seed 帳號的合成信箱網域（{spiritId}@seed.iwillshare.org.tw，見 member-roster-seed spec）——信箱不存在，寄送必退信
const SYNTHETIC_EMAIL_DOMAIN = '@seed.iwillshare.org.tw'

// 判定地址是否為不可送達的合成 seed 信箱（供寄送守門與 UI 提示重用）
export function isUndeliverableEmail(email: string): boolean {
  return email.trim().toLowerCase().endsWith(SYNTHETIC_EMAIL_DOMAIN)
}

// 寄送守門：合成 seed 信箱略過不寄（記 log、不拋錯，對呼叫端等同寄送成功）
async function sendMailSafe(options: Parameters<typeof transporter.sendMail>[0]) {
  const to = String(options.to ?? '')
  if (isUndeliverableEmail(to)) {
    console.info(`[mailer] 略過合成 seed 信箱，不寄送：${to}`)
    return
  }
  await transporter.sendMail(options)
}

// ── 臨時密碼通知信 ────────────────────────────
export async function sendTempPasswordEmail(
  to: string,
  spiritId: string,
  tempPassword: string
) {
  await sendMailSafe({
    from: FROM_ADDRESS,
    to,
    subject: '【啟動事工】您的帳號已建立 — 請查收臨時密碼',
    html: `
      <p>您好，</p>
      <p>您的啟動事工帳號已成功建立。</p>
      <p><strong>啟動事工編號（Spirit ID）：</strong> ${spiritId}</p>
      <p><strong>臨時登入密碼：</strong> <code>${tempPassword}</code></p>
      <p>請使用以上密碼登入後，系統將要求您立即變更密碼。</p>
      <p>如非您本人操作，請忽略此信。</p>
    `,
  })
}

// ── 通訊 Email 驗證信 ─────────────────────────
export async function sendCommEmailVerification(
  to: string,
  verifyUrl: string
) {
  await sendMailSafe({
    from: FROM_ADDRESS,
    to,
    subject: '【啟動事工】請驗證您的通訊 Email',
    html: `
      <p>您好，</p>
      <p>您已更新通訊 Email 為：<strong>${to}</strong></p>
      <p>請點擊以下連結完成驗證（連結 24 小時內有效）：</p>
      <p><a href="${verifyUrl}">${verifyUrl}</a></p>
      <p>如非您本人操作，請忽略此信。</p>
    `,
  })
}

// ── 密碼重設連結信 ────────────────────────────
export async function sendPasswordResetEmail(
  to: string,
  resetUrl: string
) {
  await sendMailSafe({
    from: FROM_ADDRESS,
    to,
    subject: '【啟動事工】密碼重設連結',
    html: `
      <p>您好，</p>
      <p>我們收到您的密碼重設請求。請點擊以下連結設定新密碼（連結 1 小時內有效）：</p>
      <p><a href="${resetUrl}">${resetUrl}</a></p>
      <p>如非您本人操作，請忽略此信，您的密碼不會有任何更動。</p>
    `,
  })
}

// ── 結業信（主旨與內文由後台範本提供）────────────
export async function sendGraduationEmail(
  to: string,
  subject: string,
  html: string
) {
  await sendMailSafe({
    from: FROM_ADDRESS,
    to,
    subject,
    html,
  })
}

// ── 講師身分授權通知信 ────────────────────────
export async function sendTeacherRoleGrantedEmail(
  to: string,
  bookLabel: string
) {
  await sendMailSafe({
    from: FROM_ADDRESS,
    to,
    subject: `【啟動事工】您已獲授權為「${bookLabel}」講師`,
    html: `
      <p>您好，</p>
      <p>您已被授權為「<strong>${bookLabel}</strong>」課程講師，現在可於系統開設該課程。</p>
      <p>請登入系統查看「新增授課」相關功能。</p>
    `,
  })
}
