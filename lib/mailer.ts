/*
 * ----------------------------------------------
 * Email 寄信工具（Nodemailer + SMTP）
 * 2026-03-23
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

// FROM 需使用在 Brevo 後台驗證過的寄件者 Email，不可用 SMTP_USER 帳號
const FROM_ADDRESS = `"啟動事工" <${process.env.SMTP_FROM ?? process.env.SMTP_USER}>`

// ── 臨時密碼通知信 ────────────────────────────
export async function sendTempPasswordEmail(
  to: string,
  spiritId: string,
  tempPassword: string
) {
  await transporter.sendMail({
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
  await transporter.sendMail({
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
  await transporter.sendMail({
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
