/*
 * ----------------------------------------------
 * 資料存取層 - 推播訂閱
 * 2026-08-11
 * lib/data/push-subscription.ts
 * ----------------------------------------------
 */

import { prisma } from '@/lib/prisma'

/** 取得某使用者所有有效的推播訂閱 */
export async function getPushSubscriptionsByUser(userId: string) {
  return prisma.pushSubscription.findMany({
    where: { userId },
  })
}

/** 取得某使用者目前裝置是否已訂閱（依 endpoint 比對） */
export async function getPushSubscriptionByEndpoint(endpoint: string) {
  return prisma.pushSubscription.findUnique({
    where: { endpoint },
  })
}

/** 新增或更新推播訂閱（同一 endpoint 重複訂閱時更新金鑰） */
export async function upsertPushSubscription(
  userId: string,
  sub: { endpoint: string; p256dh: string; auth: string; userAgent?: string }
) {
  return prisma.pushSubscription.upsert({
    where: { endpoint: sub.endpoint },
    create: { userId, ...sub },
    update: { userId, p256dh: sub.p256dh, auth: sub.auth, userAgent: sub.userAgent },
  })
}

/** 依 endpoint 刪除推播訂閱（取消訂閱或訂閱已失效時使用） */
export async function deletePushSubscriptionByEndpoint(endpoint: string) {
  await prisma.pushSubscription.deleteMany({
    where: { endpoint },
  })
}
