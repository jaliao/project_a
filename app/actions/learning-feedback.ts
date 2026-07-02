/*
 * ----------------------------------------------
 * Server Actions - 學習歷程回饋（學員送出 + 管理者補資料）
 * 2026-07-02
 * app/actions/learning-feedback.ts
 * ----------------------------------------------
 */

'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { canAccessAdmin } from '@/lib/auth-roles'
import { getMemberDisplayName } from '@/lib/utils/member-display'
import { learningFeedbackSchema } from '@/lib/schemas/learning-feedback'
import {
  searchTeachers,
  getUserEnrollmentsForFeedback,
  type TeacherOption,
  type UserEnrollmentItem,
} from '@/lib/data/learning-feedback'

type ActionResponse = {
  success: boolean
  message?: string
  errors?: Record<string, string[]>
}

// 補建/結業一律以 2025/09/01 為結業日（與 seed 一般結業班一致）
const GRAD_DATE = new Date('2025-09-01T00:00:00.000Z')
const GRAD_COURSE_DATE = '2025/09/01'

async function requireAdmin() {
  const session = await auth()
  if (!session?.user?.id) return { ok: false as const, res: { success: false, message: '請先登入' } }
  if (!canAccessAdmin(session.user.roles))
    return { ok: false as const, res: { success: false, message: '無權限' } }
  return { ok: true as const, adminId: session.user.id }
}

function revalidateAdmin() {
  revalidatePath('/admin/learning-feedback')
  revalidatePath('/admin')
}

// ── 學員：送出學習歷程回饋 ──
export async function submitLearningFeedback(
  formData: Record<string, unknown>
): Promise<ActionResponse> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, message: '請先登入' }

  const parsed = learningFeedbackSchema.safeParse(formData)
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors }
  }
  const d = parsed.data

  const catalog = await prisma.courseCatalog.findUnique({
    where: { id: d.courseCatalogId },
    select: { id: true },
  })
  if (!catalog) return { success: false, message: '找不到課程' }

  await prisma.learningRecordFeedback.create({
    data: {
      userId: session.user.id,
      category: d.category,
      teacherName: d.teacherName,
      courseCatalogId: d.courseCatalogId,
      note: d.note?.trim() || null,
    },
  })

  revalidatePath('/learning')
  revalidateAdmin()
  return { success: true, message: '已送出回饋，將由管理者審核' }
}

// 讀取待處理回饋（守衛：pending 才可處理）
async function loadPending(feedbackId: number) {
  const fb = await prisma.learningRecordFeedback.findUnique({
    where: { id: feedbackId },
    select: { id: true, userId: true, category: true, courseCatalogId: true, status: true },
  })
  if (!fb) return { ok: false as const, res: { success: false, message: '找不到回饋' } }
  if (fb.status !== 'pending')
    return { ok: false as const, res: { success: false, message: '此回饋已處理' } }
  return { ok: true as const, fb }
}

// 建立補建課程（該老師帶、直接結業 2025/09/01），並將學員加入為已結業
async function createBackfillCourse(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  opts: { teacherId: string; studentId: string; courseCatalogId: number }
): Promise<number> {
  const [teacher, catalog] = await Promise.all([
    tx.user.findUnique({
      where: { id: opts.teacherId },
      select: { realName: true, englishName: true, nickname: true, displayNameMode: true },
    }),
    tx.courseCatalog.findUnique({ where: { id: opts.courseCatalogId }, select: { label: true } }),
  ])
  if (!teacher) throw new Error('找不到老師')
  if (!catalog) throw new Error('找不到課程')

  const invite = await tx.courseInvite.create({
    data: {
      title: `${getMemberDisplayName(teacher)} 的 ${catalog.label}（補建）`,
      courseCatalogId: opts.courseCatalogId,
      maxCount: 1,
      courseDate: GRAD_COURSE_DATE,
      createdById: opts.teacherId,
      startedAt: GRAD_DATE,
      completedAt: GRAD_DATE,
    },
    select: { id: true },
  })
  await tx.inviteEnrollment.create({
    data: {
      inviteId: invite.id,
      userId: opts.studentId,
      status: 'approved',
      joinedAt: GRAD_DATE,
      graduatedAt: GRAD_DATE,
    },
  })
  return invite.id
}

// ── 管理者：同意建檔（遺失學習歷程）──
export async function approveMissingRecord(
  feedbackId: number,
  teacherId: string
): Promise<ActionResponse> {
  const g = await requireAdmin()
  if (!g.ok) return g.res
  const p = await loadPending(feedbackId)
  if (!p.ok) return p.res
  if (!teacherId) return { success: false, message: '請選擇老師' }

  try {
    await prisma.$transaction(async (tx) => {
      const inviteId = await createBackfillCourse(tx, {
        teacherId,
        studentId: p.fb.userId,
        courseCatalogId: p.fb.courseCatalogId,
      })
      await tx.learningRecordFeedback.update({
        where: { id: feedbackId },
        data: { status: 'approved', resolvedById: g.adminId, resolvedAt: new Date(), resultInviteId: inviteId },
      })
    })
  } catch (e) {
    console.error('approveMissingRecord 失敗', e)
    return { success: false, message: '建檔失敗，請稍後再試' }
  }

  revalidateAdmin()
  revalidatePath('/learning')
  return { success: true, message: '已建檔並標記結業' }
}

// ── 管理者：更正老師（移除錯誤班級 → 於正確老師下重建結業）──
export async function approveWrongTeacher(
  feedbackId: number,
  teacherId: string,
  wrongEnrollmentId: number
): Promise<ActionResponse> {
  const g = await requireAdmin()
  if (!g.ok) return g.res
  const p = await loadPending(feedbackId)
  if (!p.ok) return p.res
  if (!teacherId) return { success: false, message: '請選擇正確老師' }
  if (!wrongEnrollmentId) return { success: false, message: '請選擇要移除的錯誤班級' }

  // 確認錯誤報名屬於該學員
  const wrong = await prisma.inviteEnrollment.findUnique({
    where: { id: wrongEnrollmentId },
    select: { id: true, userId: true },
  })
  if (!wrong || wrong.userId !== p.fb.userId) {
    return { success: false, message: '錯誤班級與學員不符' }
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.inviteEnrollment.delete({ where: { id: wrongEnrollmentId } })
      const inviteId = await createBackfillCourse(tx, {
        teacherId,
        studentId: p.fb.userId,
        courseCatalogId: p.fb.courseCatalogId,
      })
      await tx.learningRecordFeedback.update({
        where: { id: feedbackId },
        data: { status: 'approved', resolvedById: g.adminId, resolvedAt: new Date(), resultInviteId: inviteId },
      })
    })
  } catch (e) {
    console.error('approveWrongTeacher 失敗', e)
    return { success: false, message: '更正失敗，請稍後再試' }
  }

  revalidateAdmin()
  revalidatePath('/learning')
  return { success: true, message: '已移除錯誤班級並重建結業' }
}

// ── 管理者：更正結業狀態（應結業卻未結業）──
export async function fixNotGraduated(
  feedbackId: number,
  enrollmentId: number
): Promise<ActionResponse> {
  const g = await requireAdmin()
  if (!g.ok) return g.res
  const p = await loadPending(feedbackId)
  if (!p.ok) return p.res
  if (!enrollmentId) return { success: false, message: '請選擇要更正的報名' }

  const enr = await prisma.inviteEnrollment.findUnique({
    where: { id: enrollmentId },
    select: { id: true, userId: true, inviteId: true, invite: { select: { completedAt: true } } },
  })
  if (!enr || enr.userId !== p.fb.userId) {
    return { success: false, message: '報名與學員不符' }
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.inviteEnrollment.update({
        where: { id: enrollmentId },
        data: { graduatedAt: GRAD_DATE, nonGraduateReason: null },
      })
      if (!enr.invite.completedAt) {
        await tx.courseInvite.update({ where: { id: enr.inviteId }, data: { completedAt: GRAD_DATE } })
      }
      await tx.learningRecordFeedback.update({
        where: { id: feedbackId },
        data: { status: 'approved', resolvedById: g.adminId, resolvedAt: new Date() },
      })
    })
  } catch (e) {
    console.error('fixNotGraduated 失敗', e)
    return { success: false, message: '更正失敗，請稍後再試' }
  }

  revalidateAdmin()
  revalidatePath('/learning')
  return { success: true, message: '已更正為結業' }
}

// ── 管理者：搜尋教師（供選擇器）──
export async function searchTeachersAction(q: string): Promise<TeacherOption[]> {
  const g = await requireAdmin()
  if (!g.ok) return []
  return searchTeachers(q)
}

// ── 管理者：取得學員既有報名（供 wrong_teacher / not_graduated 定位）──
export async function getStudentEnrollmentsAction(userId: string): Promise<UserEnrollmentItem[]> {
  const g = await requireAdmin()
  if (!g.ok) return []
  return getUserEnrollmentsForFeedback(userId)
}

// ── 管理者：婉拒回饋 ──
export async function rejectFeedback(feedbackId: number, note: string): Promise<ActionResponse> {
  const g = await requireAdmin()
  if (!g.ok) return g.res
  const p = await loadPending(feedbackId)
  if (!p.ok) return p.res

  await prisma.learningRecordFeedback.update({
    where: { id: feedbackId },
    data: {
      status: 'rejected',
      resolvedById: g.adminId,
      resolvedAt: new Date(),
      adminNote: note.trim() ? note.trim().slice(0, 500) : null,
    },
  })

  revalidateAdmin()
  revalidatePath('/learning')
  return { success: true, message: '已婉拒' }
}
