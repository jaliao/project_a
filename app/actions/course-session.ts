/*
 * ----------------------------------------------
 * Server Actions - 新增授課
 * 2026-03-23 (Updated: 2026-03-26)
 * app/actions/course-session.ts
 * ----------------------------------------------
 */

'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { courseSessionSchema } from '@/lib/schemas/course-session'
import { COURSE_CATALOG, type CourseLevel } from '@/config/course-catalog'
import { getUserLearningLevel } from '@/app/actions/course-invite'
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

  const parsed = courseSessionSchema.safeParse(formData)
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors }
  }

  const d = parsed.data
  const courseLevelKey = d.courseLevel as CourseLevel
  const courseEntry = COURSE_CATALOG[courseLevelKey]

  // 驗證教師先修資格（管理者略過）
  const isAdmin = session.user.role === 'admin' || session.user.role === 'superadmin'
  if (!isAdmin) {
    const learningLevel = await getUserLearningLevel(session.user.id)
    if (learningLevel < courseEntry.levelNum) {
      return {
        success: false,
        message: `開授${courseEntry.label}須先完成該課程學習`,
      }
    }
  }

  const invite = await prisma.courseInvite.create({
    data: {
      title: d.title,
      courseLevel: courseLevelKey,
      maxCount: parseInt(d.maxCount, 10),
      expiredAt: d.expiredAt,
      courseDate: formatDateString(d.courseDate),
      notes: d.notes || null,
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
