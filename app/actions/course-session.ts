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
import { canAccessAdmin, canTeach } from '@/lib/auth-roles'
import { courseSessionSchema } from '@/lib/schemas/course-session'
import { checkPrerequisites } from '@/lib/data/course-catalog'
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

  // 開課前置：須具講師身分（管理者／超級管理者視同具開課權限）
  if (!canTeach(session.user.roles)) {
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

  // 驗證教師先修資格（管理者略過）
  const isAdmin = canAccessAdmin(session.user.roles)
  if (!isAdmin) {
    const missingPrereqs = await checkPrerequisites(session.user.id, d.courseCatalogId)
    if (missingPrereqs.length > 0) {
      return {
        success: false,
        message: `開授${course.label}須先完成${missingPrereqs.map((p) => p.label).join('、')}`,
      }
    }
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
