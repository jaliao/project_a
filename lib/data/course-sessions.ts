/*
 * ----------------------------------------------
 * Data Layer - 開課記錄查詢
 * 2026-03-24 (Updated: 2026-03-30)
 * lib/data/course-sessions.ts
 * ----------------------------------------------
 */

import { prisma } from '@/lib/prisma'

export type CourseSessionItem = {
  id: number
  title: string
  courseCatalogId: number
  courseCatalogLabel: string
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
      courseCatalog: { select: { id: true, label: true } },
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
    courseCatalogId: invite.courseCatalog.id,
    courseCatalogLabel: invite.courseCatalog.label,
    maxCount: invite.maxCount,
    enrolledCount: invite._count.enrollments,
    expiredAt: invite.expiredAt,
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
  courseCatalogId: number
  courseCatalogLabel: string
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
          courseCatalog: { select: { id: true, label: true } },
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
    courseCatalogId: e.invite.courseCatalog.id,
    courseCatalogLabel: e.invite.courseCatalog.label,
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
  courseCatalogId: number
  courseCatalogLabel: string
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
  courseOrder: {
    id: number
    buyerNameZh: string
    buyerNameEn: string
    teacherName: string
    churchOrg: string
    email: string
    phone: string
    courseDate: string
    taxId: string | null
    deliveryMethod: string
    deliveryAddress: string | null
    shippedAt: Date | null
    receivedAt: Date | null
  } | null
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
      courseCatalog: { select: { id: true, label: true } },
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
      courseOrder: {
        select: {
          id: true,
          buyerNameZh: true,
          buyerNameEn: true,
          teacherName: true,
          churchOrg: true,
          email: true,
          phone: true,
          courseDate: true,
          taxId: true,
          deliveryMethod: true,
          deliveryAddress: true,
          shippedAt: true,
          receivedAt: true,
        },
      },
    },
  })

  if (!invite) return null

  const approvedEnrollments = invite.enrollments.filter((e) => e.status === 'approved')
  const pendingEnrollments = invite.enrollments.filter((e) => e.status === 'pending')

  return {
    id: invite.id,
    title: invite.title,
    courseCatalogId: invite.courseCatalog.id,
    courseCatalogLabel: invite.courseCatalog.label,
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
    courseOrder: invite.courseOrder ?? null,
  }
}

export type CompletionCertificate = {
  courseCatalogId: number
  courseCatalogLabel: string
  title: string
  teacherName: string
  graduatedAt: Date
}

/**
 * 取得指定使用者的結業證明，每個 courseCatalogId 只保留最新一筆
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
          courseCatalog: { select: { id: true, label: true } },
          createdBy: { select: { realName: true, name: true } },
        },
      },
    },
    orderBy: { graduatedAt: 'desc' },
  })

  // 以 courseCatalogId 去重，取最新一筆
  const seen = new Set<number>()
  const result: CompletionCertificate[] = []
  for (const row of rows) {
    const catalogId = row.invite.courseCatalog.id
    if (seen.has(catalogId)) continue
    seen.add(catalogId)
    result.push({
      courseCatalogId: catalogId,
      courseCatalogLabel: row.invite.courseCatalog.label,
      title: row.invite.title,
      teacherName: row.invite.createdBy.realName ?? row.invite.createdBy.name ?? '—',
      graduatedAt: row.graduatedAt!,
    })
  }
  return result
}

/**
 * 統計指定課程已核准學員的書籍選擇數量（出貨單用）
 */
export async function getEnrollmentMaterialSummary(
  inviteId: number
): Promise<{ traditional: number; simplified: number }> {
  const rows = await prisma.inviteEnrollment.findMany({
    where: {
      inviteId,
      status: 'approved',
      materialChoice: { not: 'none' },
    },
    select: { materialChoice: true },
  })

  let traditional = 0
  let simplified = 0
  for (const row of rows) {
    if (row.materialChoice === 'traditional') traditional++
    else if (row.materialChoice === 'simplified') simplified++
  }
  return { traditional, simplified }
}
