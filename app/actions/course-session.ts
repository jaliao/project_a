/*
 * ----------------------------------------------
 * Server Actions - 新增開課（合併訂購與邀請）
 * 2026-03-23
 * app/actions/course-session.ts
 * ----------------------------------------------
 */

'use server'

import { randomBytes } from 'crypto'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { courseSessionSchema } from '@/lib/schemas/course-session'
import { COURSE_CATALOG, type CourseLevel } from '@/config/course-catalog'
import { getUserLearningLevel } from '@/app/actions/course-invite'
import { createNotification } from '@/app/actions/notification'
import type { MaterialVersion, PurchaseType, DeliveryMethod } from '@prisma/client'

type ActionResponse = {
  success: boolean
  message?: string
  data?: { inviteId: number; token: string }
  errors?: Record<string, string[]>
}

// 格式化日期為 YYYY/MM/DD 字串（CourseOrder.courseDate 為 String 欄位）
function formatDateString(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}/${m}/${d}`
}

// ── 建立開課（CourseOrder + CourseInvite atomic transaction）──
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

  // 計算實際數量
  const quantity =
    d.quantityOption === 'other' ? 0 : parseInt(d.quantityOption, 10)

  const token = randomBytes(6).toString('hex')

  // 使用 callback 風格 transaction，讓 courseOrderId 可在同一 transaction 中連結
  const invite = await prisma.$transaction(async (tx) => {
    const order = await tx.courseOrder.create({
      data: {
        buyerNameZh: d.buyerNameZh,
        buyerNameEn: d.buyerNameEn,
        teacherName: d.teacherName,
        churchOrg: d.churchOrg,
        email: d.email,
        phone: d.phone,
        materialVersion: d.materialVersion as MaterialVersion,
        purchaseType: d.purchaseType as PurchaseType,
        studentNames: d.studentNames || null,
        quantity,
        quantityNote: d.quantityOption === 'other' ? (d.quantityNote ?? null) : null,
        courseDate: formatDateString(d.courseDate),
        taxId: d.taxId || null,
        deliveryMethod: d.deliveryMethod as DeliveryMethod,
        submittedById: session.user.id,
      },
    })

    const newInvite = await tx.courseInvite.create({
      data: {
        token,
        title: courseEntry.label,
        courseLevel: courseLevelKey,
        maxCount: parseInt(d.maxCount, 10),
        expiredAt: d.expiredAt,
        courseOrderId: order.id,
        createdById: session.user.id,
      },
    })

    return newInvite
  })

  // 寫入 Inbox 通知（fire-and-forget，失敗不影響主操作）
  try {
    await createNotification(
      session.user.id,
      '開課完成',
      `${courseEntry.label} 開課單已建立，預計開課日期：${formatDateString(d.courseDate)}`
    )
  } catch (e) {
    console.error('開課通知寫入失敗', e)
  }

  return {
    success: true,
    message: '開課單已建立！',
    data: { inviteId: invite.id, token: invite.token },
  }
}
