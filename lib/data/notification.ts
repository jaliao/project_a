/*
 * ----------------------------------------------
 * 資料存取層 - 通知查詢
 * 2026-03-24
 * lib/data/notification.ts
 * ----------------------------------------------
 */

import { prisma } from '@/lib/prisma'

/** 取得最新 N 則通知（倒序） */
export async function getNotifications(userId: string, limit = 20) {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })
}

/** 取得未讀通知則數 */
export async function getUnreadNotificationCount(userId: string) {
  return prisma.notification.count({
    where: { userId, isRead: false },
  })
}

/** 取得分頁通知（供歷史頁面使用） */
export async function getNotificationsPaginated(
  userId: string,
  page = 1,
  pageSize = 20
) {
  const skip = (page - 1) * pageSize
  const [items, total] = await prisma.$transaction([
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
    }),
    prisma.notification.count({ where: { userId } }),
  ])
  return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) }
}
