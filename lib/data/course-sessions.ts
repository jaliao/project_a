/*
 * ----------------------------------------------
 * Data Layer - 開課記錄查詢
 * 2026-03-24
 * lib/data/course-sessions.ts
 * ----------------------------------------------
 */

import { prisma } from '@/lib/prisma'

export type CourseSessionItem = {
  id: number
  title: string
  courseLevel: string
  maxCount: number
  enrolledCount: number
  expiredAt: Date | null
  courseDate: string | null
  createdAt: Date
}

/**
 * 取得指定使用者建立的開課記錄
 * @param userId 使用者 ID
 * @param limit 最多筆數（不傳則取全部）
 */
export async function getMyCourseSessions(
  userId: string,
  limit?: number
): Promise<CourseSessionItem[]> {
  const invites = await prisma.courseInvite.findMany({
    where: { createdById: userId },
    orderBy: { createdAt: 'desc' },
    ...(limit ? { take: limit } : {}),
    select: {
      id: true,
      title: true,
      courseLevel: true,
      maxCount: true,
      expiredAt: true,
      createdAt: true,
      _count: { select: { enrollments: true } },
      courseOrder: { select: { courseDate: true } },
    },
  })

  return invites.map((invite) => ({
    id: invite.id,
    title: invite.title,
    courseLevel: invite.courseLevel,
    maxCount: invite.maxCount,
    enrolledCount: invite._count.enrollments,
    expiredAt: invite.expiredAt,
    courseDate: invite.courseOrder?.courseDate ?? null,
    createdAt: invite.createdAt,
  }))
}

/**
 * 取得指定使用者開課記錄總數
 */
export async function getMyCourseSessionCount(userId: string): Promise<number> {
  return prisma.courseInvite.count({ where: { createdById: userId } })
}
