/*
 * ----------------------------------------------
 * Server Actions - 課程邀請
 * 2026-03-23 (Updated: 2026-07-07)
 * app/actions/course-invite.ts
 * ----------------------------------------------
 */

'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { canAccessAdmin, canTeachAny, canTeachBook } from '@/lib/auth-roles'
import { createInviteSchema, instructorFeedbackSchema } from '@/lib/schemas/course-invite'
import { checkPrerequisites } from '@/lib/data/course-catalog'
import { createNotification } from '@/app/actions/notification'
import { sendGraduationEmail } from '@/lib/mailer'
import { resolveContactEmail } from '@/lib/utils/contact-email'
import { renderTemplate } from '@/lib/utils/render-template'
import { getMemberDisplayName } from '@/lib/utils/member-display'
import { getAppUrl } from '@/lib/utils/app-url'
import { evaluateCourseStartGate } from '@/lib/utils/course-start-gate'
import { computeMaterialProgress } from '@/lib/utils/material-progress'
import { getEnrollmentMaterialSummary } from '@/lib/data/course-sessions'
import {
  getAdminSetting,
  GRADUATION_EMAIL_SUBJECT_KEY,
  GRADUATION_EMAIL_BODY_KEY,
  GRADUATION_EMAIL_SUBJECT_DEFAULT,
  GRADUATION_EMAIL_BODY_DEFAULT,
} from '@/lib/data/admin-settings'

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

  // 開課前置：須具任一書籍講師身分（管理者／超級管理者視同具開課權限）
  if (!canTeachAny(session.user.roles)) {
    return { success: false, message: '需具講師身分方可開課' }
  }

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

  // 開課資格：須具該書對應的講師身分（admin／superadmin 不受限）
  if (!canTeachBook(session.user.roles, courseCatalogId)) {
    return { success: false, message: `須具備${course.label}講師身分才能授課` }
  }

  const invite = await prisma.courseInvite.create({
    data: {
      title: course.label,
      courseCatalogId,
      maxCount,
      createdById: session.user.id,
    },
  })

  // 若建立時選擇沿用既有教材訂單，將該訂單關聯至此課程（一對多：order → invite）
  if (courseOrderId) {
    await prisma.courseOrder.update({
      where: { id: courseOrderId },
      data: { courseInviteId: invite.id },
    })
  }

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
    const inviteLink = `${getAppUrl()}/course/${courseInviteId}`
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
      orders: { select: { id: true, buyerNameZh: true, courseDate: true }, orderBy: { createdAt: 'asc' } },
      enrollments: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              realName: true,
              englishName: true,
              nickname: true,
              displayNameMode: true,
            },
          },
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
  // 該課建立者或管理者可取消（管理者可代講師操作）
  if (invite.createdById !== session.user.id && !canAccessAdmin(session.user.roles)) {
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


// ── 學員申請參加課程（含書籍選擇）────────────────────
export async function applyToCourse(
  inviteId: number,
  materialChoice: 'none' | 'traditional' | 'simplified' | 'english',
  bookName?: string
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

  // 教材所屬姓名（僅需購買版本）：必填，空白即拒絕（cr-spec-260702-005）
  let materialBookName: string | null = null
  if (materialChoice !== 'none') {
    const trimmed = bookName?.trim()
    if (!trimmed) {
      return { success: false, message: '請填寫教材所屬姓名' }
    }
    materialBookName = trimmed.slice(0, 100)
  }

  await prisma.inviteEnrollment.create({
    data: { inviteId, userId: session.user.id, status: 'pending', materialChoice, materialBookName },
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
// startDate：講師所選開課日期（YYYY-MM-DD），允許過去、不得晚於伺服器當日
export async function startCourseSession(inviteId: number, startDate: string): Promise<ActionResponse> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, message: '請先登入' }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
    return { success: false, message: '請選擇開始上課日期' }
  }
  const startedAt = new Date(`${startDate}T00:00:00`)
  if (Number.isNaN(startedAt.getTime())) {
    return { success: false, message: '開始上課日期無效' }
  }
  const todayEnd = new Date()
  todayEnd.setHours(23, 59, 59, 999)
  if (startedAt > todayEnd) {
    return { success: false, message: '開始上課日期不可晚於今天' }
  }

  const invite = await prisma.courseInvite.findUnique({
    where: { id: inviteId },
    select: {
      createdById: true,
      cancelledAt: true,
      completedAt: true,
      startedAt: true,
      materialFinalizedAt: true,
      orders: { select: { receivedAt: true, traditionalQty: true, simplifiedQty: true, englishQty: true } },
      _count: { select: { enrollments: { where: { status: 'approved' } } } },
    },
  })
  if (!invite) return { success: false, message: '找不到課程' }
  if (invite.createdById !== session.user.id) {
    return { success: false, message: '無權限執行此操作' }
  }
  if (invite.cancelledAt) return { success: false, message: '課程已取消' }
  if (invite.completedAt) return { success: false, message: '課程已結業' }
  if (invite.startedAt) return { success: false, message: '課程已在進行中' }

  // 開課門檻：≥1 已核准學員 + 教材需求已處理（尚未申請=0 或已標記完成）+ 所有訂單已收件（以當下資料重算，與 UI 共用判定）
  const total = await getEnrollmentMaterialSummary(inviteId)
  const { remaining } = computeMaterialProgress(total, invite.orders)
  const gate = evaluateCourseStartGate({
    approvedCount: invite._count.enrollments,
    remaining,
    orders: invite.orders,
    materialFinalized: !!invite.materialFinalizedAt,
  })
  if (!gate.canStart) {
    return { success: false, message: `尚不能開始上課：${gate.reasons.join('、')}` }
  }

  await prisma.courseInvite.update({
    where: { id: inviteId },
    data: { startedAt },
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
  enrollmentResults: EnrollmentResult[],
  feedback?: { rating?: number | null; testimony?: string | null }
): Promise<ActionResponse> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, message: '請先登入' }

  // 驗證未結業學員皆有原因
  const missingReason = enrollmentResults.some((r) => !r.graduated && !r.nonGraduateReason)
  if (missingReason) return { success: false, message: '請填寫未結業原因' }

  // 整體回饋（皆選填）：五星僅接受 1–5，否則存 null；見證去空白後空存 null（上限 500 字）
  const rawRating = feedback?.rating
  const gradRating =
    typeof rawRating === 'number' && rawRating >= 1 && rawRating <= 5
      ? Math.round(rawRating)
      : null
  const gradTestimony = feedback?.testimony?.trim() ? feedback.testimony.trim().slice(0, 500) : null

  const invite = await prisma.courseInvite.findUnique({ where: { id: inviteId } })
  if (!invite) return { success: false, message: '找不到課程' }
  // 該課建立者或管理者可辦理結業（管理者可代講師操作）
  if (invite.createdById !== session.user.id && !canAccessAdmin(session.user.roles)) {
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
    // 標記課程結業（以講師指定日期）＋整體回饋
    prisma.courseInvite.update({
      where: { id: inviteId },
      data: { completedAt: lastCourseDate, gradRating, gradTestimony },
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

  // 寄送結業信給本次結業學員（結業已 commit；await 確保送出，失敗僅記錄不影響結業）
  if (graduatedIds.length > 0) {
    try {
      const [subjectTpl, bodyTpl, students] = await Promise.all([
        getAdminSetting(GRADUATION_EMAIL_SUBJECT_KEY, GRADUATION_EMAIL_SUBJECT_DEFAULT),
        getAdminSetting(GRADUATION_EMAIL_BODY_KEY, GRADUATION_EMAIL_BODY_DEFAULT),
        prisma.user.findMany({
          where: { id: { in: graduatedIds } },
          select: {
            email: true,
            commEmail: true,
            isCommVerified: true,
            realName: true,
            englishName: true,
            nickname: true,
            displayNameMode: true,
            spiritId: true,
          },
        }),
      ])
      const y = lastCourseDate.getFullYear()
      const m = String(lastCourseDate.getMonth() + 1).padStart(2, '0')
      const d = String(lastCourseDate.getDate()).padStart(2, '0')
      const graduationDate = `${y}/${m}/${d}`

      for (const s of students) {
        const vars = {
          studentName: getMemberDisplayName(s),
          courseName: invite.title,
          graduationDate,
          spiritId: s.spiritId ?? '',
        }
        const subject = renderTemplate(subjectTpl, vars)
        const html = renderTemplate(bodyTpl, vars)
          .split('\n')
          .map((line) => (line.trim() ? `<p>${line}</p>` : '<br>'))
          .join('')
        const to = resolveContactEmail(s)
        try {
          await sendGraduationEmail(to, subject, html)
        } catch (err) {
          console.error(`[graduateCourse] 結業信寄送失敗 (${to})：`, err)
        }
      }
    } catch (err) {
      console.error('[graduateCourse] 結業信處理失敗：', err)
    }
  }

  return { success: true, message: '課程已結業' }
}

// ── 講師資格回饋（由課程建立者對已結業學員填寫，可重複編輯）──
export async function upsertInstructorFeedback(
  input: { enrollmentId: number; recommended: boolean; note?: string }
): Promise<ActionResponse> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, message: '請先登入' }

  const parsed = instructorFeedbackSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors }
  }
  const { enrollmentId, recommended, note } = parsed.data

  // 載入 enrollment 與所屬課程，權威驗證權限與對象
  const enrollment = await prisma.inviteEnrollment.findUnique({
    where: { id: enrollmentId },
    select: {
      graduatedAt: true,
      invite: { select: { id: true, createdById: true } },
    },
  })
  if (!enrollment) return { success: false, message: '找不到報名記錄' }

  // 僅該課程建立者（原老師）可填寫
  if (enrollment.invite.createdById !== session.user.id) {
    return { success: false, message: '無權限' }
  }
  // 僅可對已結業學員填寫
  if (!enrollment.graduatedAt) {
    return { success: false, message: '僅可對已結業學員填寫回饋' }
  }

  await prisma.inviteEnrollment.update({
    where: { id: enrollmentId },
    data: {
      teacherRecommended: recommended,
      teacherFeedbackNote: note || null,
      teacherFeedbackAt: new Date(),
    },
  })

  const { revalidatePath } = await import('next/cache')
  revalidatePath(`/course/${enrollment.invite.id}`)

  return { success: true, message: '已儲存講師資格回饋' }
}
