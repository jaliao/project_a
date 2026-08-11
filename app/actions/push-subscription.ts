/*
 * ----------------------------------------------
 * Server Actions - 推播訂閱
 * 2026-08-11
 * app/actions/push-subscription.ts
 * ----------------------------------------------
 */

'use server'

import { auth } from '@/lib/auth'
import {
  upsertPushSubscription,
  deletePushSubscriptionByEndpoint,
  getPushSubscriptionByEndpoint,
} from '@/lib/data/push-subscription'

type ActionResponse = {
  success: boolean
  message?: string
}

type PushSubscriptionInput = {
  endpoint: string
  keys: { p256dh: string; auth: string }
}

/** 訂閱推播通知：儲存目前瀏覽器的訂閱資訊 */
export async function subscribeToPush(
  subscription: PushSubscriptionInput,
  userAgent?: string
): Promise<ActionResponse> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, message: '請先登入' }

  await upsertPushSubscription(session.user.id, {
    endpoint: subscription.endpoint,
    p256dh: subscription.keys.p256dh,
    auth: subscription.keys.auth,
    userAgent,
  })

  return { success: true }
}

/** 取消訂閱推播通知：刪除目前瀏覽器的訂閱資訊 */
export async function unsubscribeFromPush(endpoint: string): Promise<ActionResponse> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, message: '請先登入' }

  const existing = await getPushSubscriptionByEndpoint(endpoint)
  if (!existing || existing.userId !== session.user.id) {
    return { success: true } // 本就不存在或不屬於自己，視為已達成目的
  }

  await deletePushSubscriptionByEndpoint(endpoint)

  return { success: true }
}
