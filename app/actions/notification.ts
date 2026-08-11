/*
 * ----------------------------------------------
 * Server Actions - 通知
 * 2026-03-24
 * app/actions/notification.ts
 * ----------------------------------------------
 */

'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { getNotifications } from '@/lib/data/notification'
import { getPushSubscriptionsByUser, deletePushSubscriptionByEndpoint } from '@/lib/data/push-subscription'
import { ensureVapidConfigured, webpush } from '@/lib/push'

type ActionResponse = {
  success: boolean
  message?: string
}

/** 標記單則通知為已讀 */
export async function markNotificationRead(id: number): Promise<ActionResponse> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, message: '請先登入' }

  const notification = await prisma.notification.findUnique({ where: { id } })
  if (!notification || notification.userId !== session.user.id) {
    return { success: false, message: '通知不存在' }
  }

  if (!notification.isRead) {
    await prisma.notification.update({
      where: { id },
      data: { isRead: true, readAt: new Date() },
    })
  }

  revalidatePath('/notifications')
  return { success: true }
}

/** 標記該使用者所有通知為已讀 */
export async function markAllNotificationsRead(): Promise<ActionResponse> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, message: '請先登入' }

  await prisma.notification.updateMany({
    where: { userId: session.user.id, isRead: false },
    data: { isRead: true, readAt: new Date() },
  })

  revalidatePath('/notifications')
  return { success: true }
}

/** 內部工具：寫入 Inbox 通知（供其他 Server Actions 呼叫，fire-and-forget） */
export async function createNotification(
  userId: string,
  title: string,
  body: string
): Promise<void> {
  await prisma.notification.create({
    data: { userId, title, body },
  })
  revalidatePath('/', 'layout')

  await sendPushToUser(userId, title, body)
}

/** 內部工具：對該使用者所有有效的推播訂閱送出推播，個別訂閱失敗不影響其他訂閱與通知寫入本身 */
async function sendPushToUser(userId: string, title: string, body: string): Promise<void> {
  const subscriptions = await getPushSubscriptionsByUser(userId)
  if (subscriptions.length === 0) return

  ensureVapidConfigured()
  const payload = JSON.stringify({ title, body })

  await Promise.allSettled(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload
        )
      } catch (error) {
        const statusCode = (error as { statusCode?: number }).statusCode
        if (statusCode === 404 || statusCode === 410) {
          await deletePushSubscriptionByEndpoint(sub.endpoint)
        } else {
          console.error('[push] sendNotification failed', sub.endpoint, error)
        }
      }
    })
  )
}

/** 取得最新通知（供 Drawer 使用） */
export async function fetchNotifications(limit = 20) {
  const session = await auth()
  if (!session?.user?.id) return []
  return getNotifications(session.user.id, limit)
}
