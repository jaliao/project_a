/*
 * ----------------------------------------------
 * Data Layer - 後台儀錶板統計查詢
 * 2026-04-03 (Updated: 2026-06-11)
 * lib/data/dashboard.ts
 * ----------------------------------------------
 */

import { prisma } from '@/lib/prisma'

export type DashboardStats = {
  totalMembers: number
  spiritInstructors: number
  richInstructors: number
  recruitingCourseSessions: number
  activeCourseSessions: number
  completedCourseSessions: number
}

/**
 * 取得儀錶板整體統計數據
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  const [
    totalMembers,
    spiritInstructors,
    richInstructors,
    recruitingCourseSessions,
    activeCourseSessions,
    completedCourseSessions,
  ] = await Promise.all([
    // 總會員數
    prisma.user.count(),
    // 啟動靈人講師資格人數（teacher 身分 AND 結業啟動靈人 catalogId=1）
    prisma.user.count({
      where: {
        roles: { has: 'teacher' },
        inviteEnrollments: {
          some: {
            graduatedAt: { not: null },
            invite: { courseCatalogId: 1 },
          },
        },
      },
    }),
    // 啟動豐盛講師資格人數（teacher 身分 AND 結業啟動豐盛 catalogId=2）
    prisma.user.count({
      where: {
        roles: { has: 'teacher' },
        inviteEnrollments: {
          some: {
            graduatedAt: { not: null },
            invite: { courseCatalogId: 2 },
          },
        },
      },
    }),
    // 開課中課程總數（招生中：未開始、未取消、未結業）
    prisma.courseInvite.count({
      where: {
        startedAt: null,
        cancelledAt: null,
        completedAt: null,
      },
    }),
    // 進行中課程總數（已開始、未取消、未結業）
    prisma.courseInvite.count({
      where: {
        startedAt: { not: null },
        cancelledAt: null,
        completedAt: null,
      },
    }),
    // 已結業課程總數
    prisma.courseInvite.count({
      where: { completedAt: { not: null } },
    }),
  ])

  return {
    totalMembers,
    spiritInstructors,
    richInstructors,
    recruitingCourseSessions,
    activeCourseSessions,
    completedCourseSessions,
  }
}
