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

  revalidatePath('/', 'layout')
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

  revalidatePath('/', 'layout')
  return { success: true }
}

/** 取得最新通知（供 Drawer 使用） */
export async function fetchNotifications(limit = 20) {
  const session = await auth()
  if (!session?.user?.id) return []
  return getNotifications(session.user.id, limit)
}
