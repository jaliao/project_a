/*
 * ----------------------------------------------
 * Server Actions - 課程邀請
 * 2026-03-23 (Updated: 2026-03-23)
 * app/actions/course-invite.ts
 * ----------------------------------------------
 */

'use server'

import { randomBytes } from 'crypto'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { createInviteSchema } from '@/lib/schemas/course-invite'
import { COURSE_CATALOG, type CourseLevel } from '@/config/course-catalog'

type ActionResponse<T = undefined> = {
  success: boolean
  message?: string
  data?: T
  errors?: Record<string, string[]>
}

// ── 計算使用者學習進度等級 ────────────────────
export async function getUserLearningLevel(userId: string): Promise<number> {
  const enrollments = await prisma.inviteEnrollment.findMany({
    where: { userId },
    include: { invite: { select: { courseLevel: true } } },
  })

  if (enrollments.length === 0) return 0

  // 取得最高完成等級數字
  const levelNums = enrollments.map((e) => {
    const entry = COURSE_CATALOG[e.invite.courseLevel as CourseLevel]
    return entry?.levelNum ?? 0
  })

  return Math.max(...levelNums)
}

// ── 建立開課邀請 ──────────────────────────────
export async function createInvite(
  formData: Record<string, string>
): Promise<ActionResponse<{ id: number; token: string }>> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, message: '請先登入' }

  const parsed = createInviteSchema.safeParse(formData)
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors }
  }

  const { courseLevel, maxCount, courseOrderId } = parsed.data
  const courseLevelKey = courseLevel as CourseLevel
  const courseEntry = COURSE_CATALOG[courseLevelKey]

  // 驗證教師先修：learningLevel >= courseLevel.levelNum
  const learningLevel = await getUserLearningLevel(session.user.id)
  if (learningLevel < courseEntry.levelNum) {
    return {
      success: false,
      message: `需先完成${courseEntry.label}才能開設此課程`,
    }
  }

  const token = randomBytes(6).toString('hex') // 12-char hex

  const invite = await prisma.courseInvite.create({
    data: {
      token,
      title: courseEntry.label,
      courseLevel: courseLevelKey,
      maxCount,
      courseOrderId: courseOrderId ?? null,
      createdById: session.user.id,
    },
  })

  return {
    success: true,
    message: '邀請已建立',
    data: { id: invite.id, token: invite.token },
  }
}

// ── 學員透過 token 加入邀請 ────────────────────
export async function joinInvite(
  token: string
): Promise<ActionResponse<{ inviteTitle: string }>> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, message: '請先登入' }

  const invite = await prisma.courseInvite.findUnique({ where: { token } })
  if (!invite) return { success: false, message: '邀請連結無效或已失效' }

  // 驗證學員先修
  const courseEntry = COURSE_CATALOG[invite.courseLevel as CourseLevel]
  if (courseEntry?.prerequisiteLevel !== null && courseEntry?.prerequisiteLevel !== undefined) {
    const learningLevel = await getUserLearningLevel(session.user.id)
    if (learningLevel < courseEntry.prerequisiteLevel) {
      const prereqLabel = Object.values(COURSE_CATALOG).find(
        (c) => c.levelNum === courseEntry.prerequisiteLevel
      )?.label ?? `啟動靈人 ${courseEntry.prerequisiteLevel}`
      return {
        success: false,
        message: `需先完成${prereqLabel}才能加入此課程`,
      }
    }
  }

  // upsert：已加入則忽略
  await prisma.inviteEnrollment.upsert({
    where: {
      inviteId_userId: { inviteId: invite.id, userId: session.user.id },
    },
    create: { inviteId: invite.id, userId: session.user.id },
    update: {},
  })

  return {
    success: true,
    data: { inviteTitle: invite.title },
  }
}

// ── 查詢當前使用者建立的邀請列表 ──────────────
export async function getMyInvites() {
  const session = await auth()
  if (!session?.user?.id) return []

  return prisma.courseInvite.findMany({
    where: { createdById: session.user.id },
    orderBy: { createdAt: 'desc' },
    include: {
      courseOrder: { select: { id: true, buyerNameZh: true, courseDate: true } },
      enrollments: {
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
        orderBy: { joinedAt: 'asc' },
      },
    },
  })
}

// ── 查詢當前使用者的 CourseOrder 清單（供建立邀請選單用）──
export async function getMyOrders() {
  const session = await auth()
  if (!session?.user?.id) return []

  return prisma.courseOrder.findMany({
    where: { submittedById: session.user.id },
    orderBy: { createdAt: 'desc' },
    select: { id: true, buyerNameZh: true, courseDate: true },
  })
}

// ── 查詢當前使用者的學習與授課紀錄 ────────────
export async function getMyLearningRecords() {
  const session = await auth()
  if (!session?.user?.id) return { enrollments: [], invites: [], learningLevel: 0 }

  const [enrollments, invites, learningLevel] = await Promise.all([
    // 已完成學習（學員）
    prisma.inviteEnrollment.findMany({
      where: { userId: session.user.id },
      orderBy: { joinedAt: 'desc' },
      include: {
        invite: {
          select: {
            id: true,
            title: true,
            courseLevel: true,
            createdBy: { select: { realName: true, name: true } },
          },
        },
      },
    }),
    // 已完成授課（教師）
    prisma.courseInvite.findMany({
      where: { createdById: session.user.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        courseLevel: true,
        createdAt: true,
        _count: { select: { enrollments: true } },
      },
    }),
    getUserLearningLevel(session.user.id),
  ])

  return { enrollments, invites, learningLevel }
}
