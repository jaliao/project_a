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
import { createNotification } from '@/app/actions/notification'

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

// ── 學員透過 token 加入邀請（建立 pending 申請）────────────────────
export async function joinInvite(
  token: string
): Promise<ActionResponse<{ inviteTitle: string; inviteId: number }>> {
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

  // upsert：已有申請記錄則忽略（不覆蓋 status）
  await prisma.inviteEnrollment.upsert({
    where: {
      inviteId_userId: { inviteId: invite.id, userId: session.user.id },
    },
    create: { inviteId: invite.id, userId: session.user.id, status: 'pending' },
    update: {},
  })

  return {
    success: true,
    data: { inviteTitle: invite.title, inviteId: invite.id },
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

// ── 取消課程 ──────────────────────────────────
export async function cancelCourseSession(
  id: number,
  cancelReason: string
): Promise<ActionResponse> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, message: '請先登入' }

  if (!cancelReason.trim()) {
    return { success: false, message: '請填寫取消原因' }
  }

  const invite = await prisma.courseInvite.findUnique({ where: { id } })
  if (!invite) return { success: false, message: '找不到課程' }
  if (invite.createdById !== session.user.id) {
    return { success: false, message: '無權限取消此課程' }
  }
  if (invite.cancelledAt) {
    return { success: false, message: '課程已取消' }
  }

  await prisma.courseInvite.update({
    where: { id },
    data: { cancelledAt: new Date(), cancelReason: cancelReason.trim() },
  })

  const { revalidatePath } = await import('next/cache')
  revalidatePath(`/course/${id}`)

  try {
    await createNotification(
      session.user.id,
      '課程已取消',
      `${invite.title} 課程已取消。取消原因：${cancelReason.trim()}`
    )
  } catch (e) {
    console.error('取消課程通知寫入失敗', e)
  }

  return { success: true, message: '課程已取消' }
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

// ── 學員申請參加課程（含書籍選擇）────────────────────
export async function applyToCourse(
  inviteId: number,
  materialChoice: 'none' | 'traditional' | 'simplified'
): Promise<ActionResponse> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, message: '請先登入' }

  const invite = await prisma.courseInvite.findUnique({ where: { id: inviteId } })
  if (!invite) return { success: false, message: '找不到課程' }
  if (invite.cancelledAt) return { success: false, message: '此課程已取消' }
  if (invite.completedAt) return { success: false, message: '此課程已結業' }
  if (invite.expiredAt && invite.expiredAt < new Date()) {
    return { success: false, message: '報名截止日期已過' }
  }

  const existing = await prisma.inviteEnrollment.findUnique({
    where: { inviteId_userId: { inviteId, userId: session.user.id } },
  })
  if (existing) return { success: false, message: '已有申請記錄' }

  await prisma.inviteEnrollment.create({
    data: { inviteId, userId: session.user.id, status: 'pending', materialChoice },
  })

  const { revalidatePath } = await import('next/cache')
  revalidatePath(`/course/${inviteId}`)

  return { success: true, message: '申請已送出，等待講師審核' }
}

// ── 講師同意學員申請 ──────────────────────────
export async function approveEnrollment(enrollmentId: number): Promise<ActionResponse> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, message: '請先登入' }

  const enrollment = await prisma.inviteEnrollment.findUnique({
    where: { id: enrollmentId },
    include: { invite: { select: { id: true, title: true, createdById: true } } },
  })
  if (!enrollment) return { success: false, message: '找不到申請記錄' }
  if (enrollment.invite.createdById !== session.user.id) {
    return { success: false, message: '無權限執行此操作' }
  }

  await prisma.inviteEnrollment.update({
    where: { id: enrollmentId },
    data: { status: 'approved' },
  })

  const { revalidatePath } = await import('next/cache')
  revalidatePath(`/course/${enrollment.invite.id}`)

  try {
    await createNotification(
      enrollment.userId,
      '報名審核通過',
      `您在 ${enrollment.invite.title} 的報名申請已通過審核，歡迎參加課程！`
    )
  } catch (e) {
    console.error('審核通過通知寫入失敗', e)
  }

  return { success: true, message: '已同意申請' }
}

// ── 講師結業課程 ──────────────────────────────
export async function graduateCourse(inviteId: number): Promise<ActionResponse> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, message: '請先登入' }

  const invite = await prisma.courseInvite.findUnique({ where: { id: inviteId } })
  if (!invite) return { success: false, message: '找不到課程' }
  if (invite.createdById !== session.user.id) {
    return { success: false, message: '無權限執行此操作' }
  }
  if (invite.completedAt) return { success: false, message: '課程已結業' }

  const graduatedCount = await prisma.inviteEnrollment.count({
    where: { inviteId, status: 'approved' },
  })

  await prisma.courseInvite.update({
    where: { id: inviteId },
    data: { completedAt: new Date() },
  })

  const { revalidatePath } = await import('next/cache')
  revalidatePath(`/course/${inviteId}`)

  try {
    await createNotification(
      session.user.id,
      '課程結業完成',
      `${invite.title} 課程已結業，共 ${graduatedCount} 位學員完成課程。`
    )
  } catch (e) {
    console.error('結業通知寫入失敗', e)
  }

  return { success: true, message: '課程已結業' }
}
