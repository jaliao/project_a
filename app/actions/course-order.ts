/*
 * ----------------------------------------------
 * Server Actions - 課程訂購
 * 2026-03-23
 * app/actions/course-order.ts
 * ----------------------------------------------
 */

'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { courseOrderSchema } from '@/lib/schemas/course-order'
import type { MaterialVersion, PurchaseType, DeliveryMethod } from '@prisma/client'

type ActionResponse = {
  success: boolean
  message?: string
  data?: { id: number }
  errors?: Record<string, string[]>
}

export async function createCourseOrder(
  formData: Record<string, string>
): Promise<ActionResponse> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, message: '請先登入' }

  const parsed = courseOrderSchema.safeParse(formData)
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors }
  }

  const d = parsed.data

  // 計算實際數量
  const quantity =
    d.quantityOption === 'other' ? 0 : parseInt(d.quantityOption, 10)

  const order = await prisma.courseOrder.create({
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
      courseDate: d.courseDate,
      taxId: d.taxId || null,
      deliveryMethod: d.deliveryMethod as DeliveryMethod,
      submittedById: session.user.id,
    },
  })

  return {
    success: true,
    message: `訂單已送出（編號 #${order.id}）`,
    data: { id: order.id },
  }
}
