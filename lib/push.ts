/*
 * ----------------------------------------------
 * Web Push VAPID 設定初始化
 * 2026-08-11
 * lib/push.ts
 * ----------------------------------------------
 */

import webpush from 'web-push'

let configured = false

/** 確保 web-push 的 VAPID 設定僅初始化一次 */
export function ensureVapidConfigured() {
  if (configured) return
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT!,
    process.env.VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  )
  configured = true
}

export { webpush }
