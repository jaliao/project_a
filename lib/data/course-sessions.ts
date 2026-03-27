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
  startedAt: Date | null
  cancelledAt: Date | null
  completedAt: Date | null
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
      startedAt: true,
      cancelledAt: true,
      completedAt: true,
      _count: { select: { enrollments: true } },
      courseDate: true,
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
    // 優先取 invite.courseDate（新流程），fallback 至 courseOrder.courseDate（舊流程）
    courseDate: invite.courseDate ?? invite.courseOrder?.courseDate ?? null,
    createdAt: invite.createdAt,
    startedAt: invite.startedAt,
    cancelledAt: invite.cancelledAt,
    completedAt: invite.completedAt,
  }))
}

export type MyEnrollmentItem = {
  enrollmentId: number
  status: 'pending' | 'approved'
  inviteId: number
  title: string
  courseLevel: string
  maxCount: number
  enrolledCount: number
  courseDate: string | null
  expiredAt: Date | null
  startedAt: Date | null
  completedAt: Date | null
  cancelledAt: Date | null
}

/**
 * 取得指定學員的所有 enrollments，含課程狀態欄位（供學員頁面三分組顯示）
 */
export async function getMyEnrollments(userId: string): Promise<MyEnrollmentItem[]> {
  const enrollments = await prisma.inviteEnrollment.findMany({
    where: { userId },
    orderBy: { joinedAt: 'desc' },
    select: {
      id: true,
      status: true,
      invite: {
        select: {
          id: true,
          title: true,
          courseLevel: true,
          maxCount: true,
          expiredAt: true,
          startedAt: true,
          completedAt: true,
          cancelledAt: true,
          _count: { select: { enrollments: true } },
          courseOrder: { select: { courseDate: true } },
        },
      },
    },
  })

  return enrollments.map((e) => ({
    enrollmentId: e.id,
    status: e.status as 'pending' | 'approved',
    inviteId: e.invite.id,
    title: e.invite.title,
    courseLevel: e.invite.courseLevel,
    maxCount: e.invite.maxCount,
    enrolledCount: e.invite._count.enrollments,
    courseDate: e.invite.courseOrder?.courseDate ?? null,
    expiredAt: e.invite.expiredAt,
    startedAt: e.invite.startedAt,
    completedAt: e.invite.completedAt,
    cancelledAt: e.invite.cancelledAt,
  }))
}

/**
 * 取得指定使用者開課記錄總數
 */
export async function getMyCourseSessionCount(userId: string): Promise<number> {
  return prisma.courseInvite.count({ where: { createdById: userId } })
}

type EnrollmentRecord = {
  id: number
  joinedAt: Date
  status: string
  materialChoice: string
  graduatedAt: Date | null
  nonGraduateReason: string | null
  user: {
    id: string
    name: string | null
    email: string | null
  }
}

export type CourseSessionDetail = {
  id: number
  title: string
  courseLevel: string
  maxCount: number
  expiredAt: Date | null
  createdAt: Date
  startedAt: Date | null
  cancelledAt: Date | null
  cancelReason: string | null
  completedAt: Date | null
  createdBy: {
    id: string
    name: string | null
    email: string | null
    realName: string | null
  }
  approvedEnrollments: EnrollmentRecord[]
  pendingEnrollments: EnrollmentRecord[]
  courseDate: string | null
}

/**
 * 取得單一開課記錄詳情，含授課老師與學員名單（分 approved / pending）
 */
export async function getCourseSessionById(
  id: number
): Promise<CourseSessionDetail | null> {
  const invite = await prisma.courseInvite.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      courseLevel: true,
      maxCount: true,
      expiredAt: true,
      createdAt: true,
      startedAt: true,
      cancelledAt: true,
      cancelReason: true,
      completedAt: true,
      courseDate: true,
      createdBy: { select: { id: true, name: true, email: true, realName: true } },
      enrollments: {
        select: {
          id: true,
          joinedAt: true,
          status: true,
          materialChoice: true,
          graduatedAt: true,
          nonGraduateReason: true,
          user: { select: { id: true, name: true, email: true } },
        },
        orderBy: { joinedAt: 'asc' },
      },
      courseOrder: { select: { courseDate: true } },
    },
  })

  if (!invite) return null

  const approvedEnrollments = invite.enrollments.filter((e) => e.status === 'approved')
  const pendingEnrollments = invite.enrollments.filter((e) => e.status === 'pending')

  return {
    id: invite.id,
    title: invite.title,
    courseLevel: invite.courseLevel,
    maxCount: invite.maxCount,
    expiredAt: invite.expiredAt,
    createdAt: invite.createdAt,
    startedAt: invite.startedAt,
    cancelledAt: invite.cancelledAt,
    cancelReason: invite.cancelReason,
    completedAt: invite.completedAt,
    createdBy: invite.createdBy,
    approvedEnrollments,
    pendingEnrollments,
    courseDate: invite.courseDate ?? invite.courseOrder?.courseDate ?? null,
  }
}

export type CompletionCertificate = {
  courseLevel: string
  title: string
  teacherName: string
  graduatedAt: Date
}

/**
 * 取得指定使用者的結業證明，每個 courseLevel 只保留最新一筆
 */
export async function getMyCompletionCertificates(
  userId: string
): Promise<CompletionCertificate[]> {
  const rows = await prisma.inviteEnrollment.findMany({
    where: { userId, graduatedAt: { not: null } },
    select: {
      graduatedAt: true,
      invite: {
        select: {
          title: true,
          courseLevel: true,
          createdBy: { select: { realName: true, name: true } },
        },
      },
    },
    orderBy: { graduatedAt: 'desc' },
  })

  // 以 courseLevel 去重，取最新一筆
  const seen = new Set<string>()
  const result: CompletionCertificate[] = []
  for (const row of rows) {
    if (seen.has(row.invite.courseLevel)) continue
    seen.add(row.invite.courseLevel)
    result.push({
      courseLevel: row.invite.courseLevel,
      title: row.invite.title,
      teacherName: row.invite.createdBy.realName ?? row.invite.createdBy.name ?? '—',
      graduatedAt: row.graduatedAt!,
    })
  }
  return result
}
