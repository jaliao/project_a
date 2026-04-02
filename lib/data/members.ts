/*
 * ----------------------------------------------
 * Data Layer - 會員管理
 * 2026-04-01
 * lib/data/members.ts
 * ----------------------------------------------
 */

import { prisma } from '@/lib/prisma'

// ==========================================
// 搜尋會員清單
// ==========================================
export async function searchMembers(q?: string) {
  const where = q
    ? {
        OR: [
          { realName: { contains: q, mode: 'insensitive' as const } },
          { name: { contains: q, mode: 'insensitive' as const } },
          { nickname: { contains: q, mode: 'insensitive' as const } },
          { email: { contains: q, mode: 'insensitive' as const } },
        ],
      }
    : {}

  return prisma.user.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      realName: true,
      nickname: true,
      email: true,
      spiritId: true,
      role: true,
      createdAt: true,
    },
  })
}

// ==========================================
// 取得單一會員詳情（含學習與授課紀錄）
// ==========================================
export async function getMemberDetail(id: string) {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      realName: true,
      nickname: true,
      email: true,
      spiritId: true,
      role: true,
      createdAt: true,
      churchType: true,
      churchOther: true,
      church: { select: { name: true } },
      // 學習紀錄：參加的課程（已開始）
      inviteEnrollments: {
        where: {
          invite: { startedAt: { not: null } },
        },
        select: {
          invite: {
            select: {
              id: true,
              title: true,
              startedAt: true,
              courseCatalog: { select: { label: true } },
            },
          },
        },
      },
      // 授課紀錄：自己建立的課程（已開始）
      courseInvites: {
        where: { startedAt: { not: null } },
        select: {
          id: true,
          title: true,
          startedAt: true,
          courseCatalog: { select: { label: true } },
        },
        orderBy: { startedAt: 'desc' },
      },
    },
  })
}

export type MemberDetail = NonNullable<Awaited<ReturnType<typeof getMemberDetail>>>
