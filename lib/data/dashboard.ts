/*
 * ----------------------------------------------
 * Data Layer - 後台儀錶板統計查詢
 * 2026-04-03
 * lib/data/dashboard.ts
 * ----------------------------------------------
 */

import { prisma } from '@/lib/prisma'

export type DashboardStats = {
  totalMembers: number
  spiritInstructors: number
  richInstructors: number
  activeCourseSessions: number
}

export type CourseStatItem = {
  catalogId: number
  label: string
  count: number
}

/**
 * 取得儀錶板整體統計數據
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  const [
    totalMembers,
    spiritRows,
    richRows,
    activeCourseSessions,
  ] = await Promise.all([
    // 總學員數
    prisma.user.count(),
    // 啟動靈人資格講師（catalogId=1 結業，去重 userId）
    prisma.inviteEnrollment.findMany({
      where: {
        graduatedAt: { not: null },
        invite: { courseCatalogId: 1 },
      },
      distinct: ['userId'],
      select: { userId: true },
    }),
    // 啟動豐盛資格講師（catalogId=2 結業，去重 userId）
    prisma.inviteEnrollment.findMany({
      where: {
        graduatedAt: { not: null },
        invite: { courseCatalogId: 2 },
      },
      distinct: ['userId'],
      select: { userId: true },
    }),
    // 目前進行中課程總數
    prisma.courseInvite.count({
      where: {
        startedAt: { not: null },
        cancelledAt: null,
        completedAt: null,
      },
    }),
  ])

  return {
    totalMembers,
    spiritInstructors: spiritRows.length,
    richInstructors: richRows.length,
    activeCourseSessions,
  }
}

/**
 * 取得指定天數內各課程類別的開始上課次數
 */
export async function getCourseStartStats(days: number): Promise<CourseStatItem[]> {
  const since = new Date()
  since.setDate(since.getDate() - days)

  const invites = await prisma.courseInvite.findMany({
    where: { startedAt: { gte: since } },
    select: {
      courseCatalogId: true,
      courseCatalog: { select: { label: true } },
    },
  })

  // 依 catalogId 分組計數
  const map = new Map<number, { label: string; count: number }>()
  for (const inv of invites) {
    const id = inv.courseCatalogId
    if (!map.has(id)) {
      map.set(id, { label: inv.courseCatalog.label, count: 0 })
    }
    map.get(id)!.count++
  }

  return Array.from(map.entries())
    .map(([catalogId, { label, count }]) => ({ catalogId, label, count }))
    .sort((a, b) => a.catalogId - b.catalogId)
}

/**
 * 取得指定天數內各課程類別的順利結業人數
 */
export async function getGraduationStats(days: number): Promise<CourseStatItem[]> {
  const since = new Date()
  since.setDate(since.getDate() - days)

  const enrollments = await prisma.inviteEnrollment.findMany({
    where: { graduatedAt: { gte: since } },
    select: {
      invite: {
        select: {
          courseCatalogId: true,
          courseCatalog: { select: { label: true } },
        },
      },
    },
  })

  // 依 catalogId 分組計數
  const map = new Map<number, { label: string; count: number }>()
  for (const e of enrollments) {
    const id = e.invite.courseCatalogId
    if (!map.has(id)) {
      map.set(id, { label: e.invite.courseCatalog.label, count: 0 })
    }
    map.get(id)!.count++
  }

  return Array.from(map.entries())
    .map(([catalogId, { label, count }]) => ({ catalogId, label, count }))
    .sort((a, b) => a.catalogId - b.catalogId)
}
