/*
 * ----------------------------------------------
 * Server Actions - 新增授課
 * 2026-03-23 (Updated: 2026-07-07)
 * app/actions/course-session.ts
 * ----------------------------------------------
 */

'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { canAccessAdmin, canTeachAny, canTeachBook } from '@/lib/auth-roles'
import {
  courseSessionSchema,
  editCourseInfoSchema,
  editStartedCourseInfoSchema,
  editCompletedCourseInfoSchema,
} from '@/lib/schemas/course-session'
import { resolveMaxCapacity } from '@/lib/data/admin-settings'
import { createNotification } from '@/app/actions/notification'

type ActionResponse = {
  success: boolean
  message?: string
  data?: { inviteId: number }
  errors?: Record<string, string[]>
}

// 格式化日期為 YYYY/MM/DD 字串
function formatDateString(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}/${m}/${d}`
}

// ── 建立授課（僅建立 CourseInvite）──
export async function createCourseSession(
  formData: Record<string, unknown>
): Promise<ActionResponse> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, message: '請先登入' }

  // 開課前置：須具任一書籍講師身分（管理者／超級管理者視同具開課權限）
  if (!canTeachAny(session.user.roles)) {
    return { success: false, message: '需具講師身分方可開課' }
  }

  const parsed = courseSessionSchema.safeParse(formData)
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors }
  }

  const d = parsed.data

  // 人數上限：一般使用者受 class_max_capacity 限制，管理者可放寬（至硬頂）
  const maxCountNum = parseInt(d.maxCount, 10)
  const { capacity, effective } = await resolveMaxCapacity(canAccessAdmin(session.user.roles))
  if (maxCountNum > effective) {
    return { success: false, errors: { maxCount: [`每班最多 ${capacity} 人`] } }
  }

  // 取得課程資料
  const course = await prisma.courseCatalog.findUnique({
    where: { id: d.courseCatalogId },
    select: { id: true, label: true, isActive: true },
  })
  if (!course) return { success: false, message: '找不到課程' }
  if (!course.isActive) return { success: false, message: '此課程目前未開放' }

  // 開課資格：須具該書對應的講師身分（admin／superadmin 不受限）
  if (!canTeachBook(session.user.roles, d.courseCatalogId)) {
    return { success: false, message: `須具備${course.label}講師身分才能授課` }
  }

  const invite = await prisma.courseInvite.create({
    data: {
      title: d.title,
      courseCatalogId: d.courseCatalogId,
      maxCount: maxCountNum,
      expiredAt: d.expiredAt,
      courseDate: formatDateString(d.courseDate),
      notes: d.notes || null,
      isPublicMatch: d.isPublicMatch ?? false,
      matchNote: d.matchNote || null,
      createdById: session.user.id,
    },
  })

  // 寫入 Inbox 通知（fire-and-forget，失敗不影響主操作）
  try {
    await createNotification(
      session.user.id,
      '授課已建立',
      `${d.title} 已建立，預計開課日期：${formatDateString(d.courseDate)}`
    )
  } catch (e) {
    console.error('授課通知寫入失敗', e)
  }

  return {
    success: true,
    message: '授課已建立！',
    data: { inviteId: invite.id },
  }
}

// ── 更新公開媒合設定（僅課程講師或管理者）──
export async function updateMatchSettings(
  inviteId: number,
  input: { isPublicMatch: boolean; matchNote?: string }
): Promise<ActionResponse> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, message: '請先登入' }

  const invite = await prisma.courseInvite.findUnique({
    where: { id: inviteId },
    select: { createdById: true },
  })
  if (!invite) return { success: false, message: '找不到課程' }

  const isOwner = invite.createdById === session.user.id
  if (!isOwner && !canAccessAdmin(session.user.roles)) {
    return { success: false, message: '無權限' }
  }

  const matchNote = (input.matchNote ?? '').trim()
  if (matchNote.length > 500) {
    return { success: false, message: '招募備註最長 500 字' }
  }

  await prisma.courseInvite.update({
    where: { id: inviteId },
    // 關閉公開媒合時保留 matchNote（草稿），僅不於布告欄顯示
    data: { isPublicMatch: input.isPublicMatch, matchNote: matchNote || null },
  })

  revalidatePath(`/course/${inviteId}`)
  revalidatePath('/match-board')
  return { success: true, message: input.isPublicMatch ? '已開啟公開媒合' : '已關閉公開媒合' }
}

// ── 依課程狀態編輯課程資訊（擁有者或管理者；已取消不可編輯）──
// 欄位白名單以 DB 當下狀態決定（不信任 client 宣稱）：
// 招生中：名稱／預計人數／截止日／開課日／備註；進行中：名稱＋開始上課日期；
// 已結業：名稱＋開始上課日期＋結業日期（不連動學員個人 graduatedAt）
// 一律不可改書本（courseCatalogId）
export async function updateCourseInfo(
  inviteId: number,
  input: {
    title: string
    maxCount?: number | string
    expiredAt?: Date | string
    courseDate?: Date | string
    notes?: string
    startedAt?: Date | string
    completedAt?: Date | string
  }
): Promise<ActionResponse> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, message: '請先登入' }

  const invite = await prisma.courseInvite.findUnique({
    where: { id: inviteId },
    select: {
      createdById: true,
      startedAt: true,
      cancelledAt: true,
      completedAt: true,
      _count: { select: { enrollments: { where: { status: 'approved' } } } },
    },
  })
  if (!invite) return { success: false, message: '找不到課程' }

  const isOwner = invite.createdById === session.user.id
  if (!isOwner && !canAccessAdmin(session.user.roles)) {
    return { success: false, message: '無權限' }
  }

  if (invite.cancelledAt) {
    return { success: false, message: '課程已取消，無法編輯' }
  }

  // 已結業：名稱＋開始上課日期＋結業日期
  if (invite.completedAt) {
    const parsed = editCompletedCourseInfoSchema.safeParse(input)
    if (!parsed.success) {
      return { success: false, errors: parsed.error.flatten().fieldErrors }
    }
    await prisma.courseInvite.update({
      where: { id: inviteId },
      data: {
        title: parsed.data.title,
        startedAt: parsed.data.startedAt,
        completedAt: parsed.data.completedAt,
      },
    })
    revalidatePath(`/course/${inviteId}`)
    return { success: true, message: '已更新課程資訊' }
  }

  // 進行中：名稱＋開始上課日期
  if (invite.startedAt) {
    const parsed = editStartedCourseInfoSchema.safeParse(input)
    if (!parsed.success) {
      return { success: false, errors: parsed.error.flatten().fieldErrors }
    }
    await prisma.courseInvite.update({
      where: { id: inviteId },
      data: {
        title: parsed.data.title,
        startedAt: parsed.data.startedAt,
      },
    })
    revalidatePath(`/course/${inviteId}`)
    return { success: true, message: '已更新課程資訊' }
  }

  // 招生中：維持現行欄位與人數規則
  const parsed = editCourseInfoSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors }
  }
  const d = parsed.data

  // 人數上限：一般使用者受 class_max_capacity；管理者可放寬（至硬頂）
  const { capacity, effective } = await resolveMaxCapacity(canAccessAdmin(session.user.roles))
  if (d.maxCount > effective) {
    return { success: false, errors: { maxCount: [`每班最多 ${capacity} 人`] } }
  }

  // 預計人數不得低於已核准學員數（以當下資料為準）
  const approvedCount = invite._count.enrollments
  if (d.maxCount < approvedCount) {
    return { success: false, message: `預計人數不可低於已核准學員數（${approvedCount}）` }
  }

  await prisma.courseInvite.update({
    where: { id: inviteId },
    data: {
      title: d.title,
      maxCount: d.maxCount,
      expiredAt: d.expiredAt,
      courseDate: formatDateString(d.courseDate),
      notes: d.notes?.trim() || null,
    },
  })

  revalidatePath(`/course/${inviteId}`)
  revalidatePath('/match-board')
  return { success: true, message: '已更新課程資訊' }
}

// ── 重新招募作業（進行中退回招生中）──
// 該課建立者或管理者可操作；僅清除 startedAt，既有報名與教材紀錄不受影響
// 不發送通知、不寫入操作紀錄（LOG 範圍維持學員增刪）
export async function reopenRecruitment(inviteId: number): Promise<ActionResponse> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, message: '請先登入' }

  const invite = await prisma.courseInvite.findUnique({
    where: { id: inviteId },
    select: { id: true, createdById: true, startedAt: true, completedAt: true, cancelledAt: true },
  })
  if (!invite) return { success: false, message: '找不到課程' }
  if (invite.createdById !== session.user.id && !canAccessAdmin(session.user.roles)) {
    return { success: false, message: '無權限' }
  }
  if (!invite.startedAt || invite.completedAt || invite.cancelledAt) {
    return { success: false, message: '僅進行中的課程可退回招生中' }
  }

  await prisma.courseInvite.update({ where: { id: inviteId }, data: { startedAt: null } })

  revalidatePath('/admin/course-sessions')
  revalidatePath(`/course/${inviteId}`)
  return { success: true, message: '已退回招生中' }
}
