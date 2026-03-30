/*
 * ----------------------------------------------
 * Server Actions - 課程邀請
 * 2026-03-23 (Updated: 2026-03-30)
 * app/actions/course-invite.ts
 * ----------------------------------------------
 */

'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { createInviteSchema } from '@/lib/schemas/course-invite'
import { checkPrerequisites } from '@/lib/data/course-catalog'
import { createNotification } from '@/app/actions/notification'

type ActionResponse<T = undefined> = {
  success: boolean
  message?: string
  data?: T
  errors?: Record<string, string[]>
}

// ── 建立開課邀請 ──────────────────────────────
export async function createInvite(
  formData: Record<string, string>
): Promise<ActionResponse<{ id: number }>> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, message: '請先登入' }

  const parsed = createInviteSchema.safeParse(formData)
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors }
  }

  const { courseCatalogId, maxCount, courseOrderId } = parsed.data

  // 取得課程資料
  const course = await prisma.courseCatalog.findUnique({
    where: { id: courseCatalogId },
    select: { id: true, label: true, isActive: true },
  })
  if (!course) return { success: false, message: '找不到課程' }
  if (!course.isActive) return { success: false, message: '此課程目前未開放' }

  // 驗證教師先修（admin/superadmin 豁免）
  const isAdmin = session.user.role === 'admin' || session.user.role === 'superadmin'
  if (!isAdmin) {
    const missingPrereqs = await checkPrerequisites(session.user.id, courseCatalogId)
    if (missingPrereqs.length > 0) {
      return {
        success: false,
        message: `需先完成${missingPrereqs.map((p) => p.label).join('、')}才能開設此課程`,
      }
    }
  }

  const invite = await prisma.courseInvite.create({
    data: {
      title: course.label,
      courseCatalogId,
      maxCount,
      courseOrderId: courseOrderId ?? null,
      createdById: session.user.id,
    },
  })

  return {
    success: true,
    message: '邀請已建立',
    data: { id: invite.id },
  }
}

// ── 透過 Spirit ID 邀請學員 ───────────────────
export async function inviteBySpirtId(
  courseInviteId: number,
  spiritId: string
): Promise<ActionResponse<undefined>> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, message: '請先登入' }

  // 驗證 CourseInvite 存在
  const invite = await prisma.courseInvite.findUnique({
    where: { id: courseInviteId },
    select: { id: true, title: true },
  })
  if (!invite) return { success: false, message: '課程邀請不存在' }

  // 查找 Spirit ID 對應的 User
  const targetUser = await prisma.user.findUnique({
    where: { spiritId: spiritId.toUpperCase() },
    select: { id: true },
  })
  if (!targetUser) return { success: false, message: '找不到此會員編號，請確認後重試' }

  // 發送 Inbox 通知（fire-and-forget）
  try {
    const origin = process.env.NEXTAUTH_URL ?? ''
    const inviteLink = `${origin}/course/${courseInviteId}`
    await createNotification(
      targetUser.id,
      '課程邀請',
      `您收到「${invite.title}」的課程邀請，請點擊連結查看詳情：${inviteLink}`
    )
  } catch (e) {
    console.error('Spirit ID 邀請通知寫入失敗', e)
  }

  return { success: true, message: '邀請通知已送出' }
}

// ── 查詢當前使用者建立的邀請列表 ──────────────
export async function getMyInvites() {
  const session = await auth()
  if (!session?.user?.id) return []

  return prisma.courseInvite.findMany({
    where: { createdById: session.user.id },
    orderBy: { createdAt: 'desc' },
    include: {
      courseCatalog: { select: { id: true, label: true } },
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
  if (!session?.user?.id) return { enrollments: [], invites: [] }

  const [enrollments, invites] = await Promise.all([
    // 已完成學習（學員）
    prisma.inviteEnrollment.findMany({
      where: { userId: session.user.id },
      orderBy: { joinedAt: 'desc' },
      include: {
        invite: {
          select: {
            id: true,
            title: true,
            courseCatalog: { select: { id: true, label: true } },
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
        courseCatalog: { select: { id: true, label: true } },
        createdAt: true,
        _count: { select: { enrollments: true } },
      },
    }),
  ])

  return { enrollments, invites }
}

// ── 學員申請參加課程（含書籍選擇）────────────────────
export async function applyToCourse(
  inviteId: number,
  materialChoice: 'none' | 'traditional' | 'simplified'
): Promise<ActionResponse> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, message: '請先登入' }

  const invite = await prisma.courseInvite.findUnique({
    where: { id: inviteId },
    include: { courseCatalog: { select: { id: true, prerequisites: { select: { id: true, label: true } } } } },
  })
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

  // 驗證學員先修
  const missingPrereqs = await checkPrerequisites(session.user.id, invite.courseCatalogId)
  if (missingPrereqs.length > 0) {
    return {
      success: false,
      message: `需先完成${missingPrereqs.map((p) => p.label).join('、')}才能加入此課程`,
    }
  }

  await prisma.inviteEnrollment.create({
    data: { inviteId, userId: session.user.id, status: 'pending', materialChoice },
  })

  const { revalidatePath } = await import('next/cache')
  revalidatePath(`/course/${inviteId}`)

  // 通知講師有新申請（fire-and-forget）
  const applicantName =
    (session.user.name && session.user.name.trim()) || session.user.email || '學員'
  try {
    await createNotification(
      invite.createdById,
      '新申請通知',
      `${applicantName} 申請加入「${invite.title}」，請前往課程詳情審核。`
    )
  } catch (e) {
    console.error('新申請通知寫入失敗', e)
  }

  return { success: true, message: '申請已送出，等待講師審核' }
}

// ── 講師開始上課（招生中 → 進行中）──────────────────
export async function startCourseSession(inviteId: number): Promise<ActionResponse> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, message: '請先登入' }

  const invite = await prisma.courseInvite.findUnique({ where: { id: inviteId } })
  if (!invite) return { success: false, message: '找不到課程' }
  if (invite.createdById !== session.user.id) {
    return { success: false, message: '無權限執行此操作' }
  }
  if (invite.cancelledAt) return { success: false, message: '課程已取消' }
  if (invite.completedAt) return { success: false, message: '課程已結業' }
  if (invite.startedAt) return { success: false, message: '課程已在進行中' }

  await prisma.courseInvite.update({
    where: { id: inviteId },
    data: { startedAt: new Date() },
  })

  const { revalidatePath } = await import('next/cache')
  revalidatePath(`/course/${inviteId}`)

  return { success: true, message: '課程已開始' }
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

// ── 講師結業課程（含選擇通過學員與未結業原因）──────────────
export type EnrollmentResult = {
  userId: string
  graduated: boolean
  nonGraduateReason?: string // insufficient_time | other（graduated: false 時必填）
}

export async function graduateCourse(
  inviteId: number,
  lastCourseDate: Date,
  enrollmentResults: EnrollmentResult[]
): Promise<ActionResponse> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, message: '請先登入' }

  // 驗證未結業學員皆有原因
  const missingReason = enrollmentResults.some((r) => !r.graduated && !r.nonGraduateReason)
  if (missingReason) return { success: false, message: '請填寫未結業原因' }

  const invite = await prisma.courseInvite.findUnique({ where: { id: inviteId } })
  if (!invite) return { success: false, message: '找不到課程' }
  if (invite.createdById !== session.user.id) {
    return { success: false, message: '無權限執行此操作' }
  }
  if (invite.completedAt) return { success: false, message: '課程已結業' }

  // 驗證：僅 approved 學員才能被處理
  const approvedEnrollments = await prisma.inviteEnrollment.findMany({
    where: { inviteId, status: 'approved' },
    select: { userId: true },
  })
  const approvedUserIds = new Set(approvedEnrollments.map((e) => e.userId))
  const validResults = enrollmentResults.filter((r) => approvedUserIds.has(r.userId))

  const graduatedIds = validResults.filter((r) => r.graduated).map((r) => r.userId)
  const nonGraduated = validResults.filter((r) => !r.graduated)

  await prisma.$transaction([
    // 已結業學員：設定 graduatedAt 為最後一堂課程日期
    prisma.inviteEnrollment.updateMany({
      where: { inviteId, userId: { in: graduatedIds } },
      data: { graduatedAt: lastCourseDate },
    }),
    // 未結業學員：儲存原因
    ...nonGraduated.map((r) =>
      prisma.inviteEnrollment.updateMany({
        where: { inviteId, userId: r.userId },
        data: { nonGraduateReason: r.nonGraduateReason },
      })
    ),
    // 標記課程結業（以講師指定日期）
    prisma.courseInvite.update({
      where: { id: inviteId },
      data: { completedAt: lastCourseDate },
    }),
  ])

  const { revalidatePath } = await import('next/cache')
  revalidatePath(`/course/${inviteId}`)
  revalidatePath(`/course/${inviteId}/graduate`)

  try {
    await createNotification(
      session.user.id,
      '課程結業完成',
      `${invite.title} 課程已結業，共 ${graduatedIds.length} 位學員通過結業。`
    )
  } catch (e) {
    console.error('結業通知寫入失敗', e)
  }

  return { success: true, message: '課程已結業' }
}
