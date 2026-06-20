/*
 * ----------------------------------------------
 * Server Actions - 新增授課
 * 2026-03-23 (Updated: 2026-03-30)
 * app/actions/course-session.ts
 * ----------------------------------------------
 */

'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { canAccessAdmin, canTeachAny, canTeachBook } from '@/lib/auth-roles'
import { courseSessionSchema } from '@/lib/schemas/course-session'
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
      maxCount: parseInt(d.maxCount, 10),
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

// ── 後台變更課程狀態（僅管理者）──
// target 限招生中／進行中／已取消；不提供已結業（結業仍由講師走逐學員結業頁）
// 自由任意轉換（含回退），不發送通知（屬行政更正）
export async function setCourseStatusAdmin(
  inviteId: number,
  target: 'recruiting' | 'started' | 'cancelled'
): Promise<ActionResponse> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, message: '請先登入' }
  if (!canAccessAdmin(session.user.roles)) return { success: false, message: '無權限' }

  if (!['recruiting', 'started', 'cancelled'].includes(target)) {
    return { success: false, message: '不支援的狀態' }
  }

  const invite = await prisma.courseInvite.findUnique({
    where: { id: inviteId },
    select: { id: true },
  })
  if (!invite) return { success: false, message: '找不到課程' }

  // 依目標狀態設定／清除旗標
  const data =
    target === 'recruiting'
      ? { startedAt: null, cancelledAt: null, completedAt: null, cancelReason: null }
      : target === 'started'
        ? { startedAt: new Date(), cancelledAt: null, completedAt: null, cancelReason: null }
        : { cancelledAt: new Date(), cancelReason: '（管理者後台調整）' }

  await prisma.courseInvite.update({ where: { id: inviteId }, data })

  revalidatePath('/admin/course-sessions')
  revalidatePath(`/course/${inviteId}`)

  const label = target === 'recruiting' ? '招生中' : target === 'started' ? '進行中' : '已取消'
  return { success: true, message: `已變更為「${label}」` }
}
