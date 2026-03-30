/*
 * ----------------------------------------------
 * Server Actions - 課程訂購
 * 2026-03-23 (Updated: 2026-03-30)
 * app/actions/course-order.ts
 * ----------------------------------------------
 */

'use server'

import { revalidatePath } from 'next/cache'
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

/**
 * 講師申請教材 — 建立或更新 CourseOrder 並關聯至 CourseInvite
 */
export async function applyMaterialOrder(
  inviteId: number,
  formData: Record<string, string>
): Promise<ActionResponse> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, message: '請先登入' }

  // 確認是課程講師
  const invite = await prisma.courseInvite.findUnique({
    where: { id: inviteId },
    select: { createdById: true, courseOrderId: true },
  })
  if (!invite) return { success: false, message: '找不到課程' }
  if (invite.createdById !== session.user.id) {
    return { success: false, message: '無權限' }
  }

  // 若已有 CourseOrder，且已寄送則禁止修改
  if (invite.courseOrderId) {
    const existing = await prisma.courseOrder.findUnique({
      where: { id: invite.courseOrderId },
      select: { shippedAt: true },
    })
    if (existing?.shippedAt) {
      return { success: false, message: '教材已寄出，無法修改申請' }
    }
  }

  const parsed = courseOrderSchema.safeParse(formData)
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors }
  }

  const d = parsed.data
  const quantity =
    d.quantityOption === 'other' ? 0 : parseInt(d.quantityOption, 10)

  const orderData = {
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
  }

  if (invite.courseOrderId) {
    // 更新現有 CourseOrder
    await prisma.courseOrder.update({
      where: { id: invite.courseOrderId },
      data: orderData,
    })
    revalidatePath(`/course/${inviteId}`)
    return { success: true, message: '教材申請已更新' }
  } else {
    // 建立新 CourseOrder 並關聯
    const order = await prisma.courseOrder.create({ data: orderData })
    await prisma.courseInvite.update({
      where: { id: inviteId },
      data: { courseOrderId: order.id },
    })
    revalidatePath(`/course/${inviteId}`)
    return { success: true, message: '教材申請已送出', data: { id: order.id } }
  }
}

/**
 * 管理者確認已寄送教材
 */
export async function confirmShipment(orderId: number): Promise<ActionResponse> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, message: '請先登入' }

  const isAdmin =
    session.user.role === 'admin' || session.user.role === 'superadmin'
  if (!isAdmin) return { success: false, message: '無權限' }

  const order = await prisma.courseOrder.findUnique({
    where: { id: orderId },
    select: { shippedAt: true },
  })
  if (!order) return { success: false, message: '找不到申請記錄' }
  if (order.shippedAt) return { success: false, message: '已標記為寄送中' }

  await prisma.courseOrder.update({
    where: { id: orderId },
    data: { shippedAt: new Date() },
  })

  revalidatePath('/admin/materials')
  return { success: true, message: '已標記為已寄送' }
}

/**
 * 講師確認收件
 */
export async function confirmReceipt(inviteId: number): Promise<ActionResponse> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, message: '請先登入' }

  const invite = await prisma.courseInvite.findUnique({
    where: { id: inviteId },
    select: {
      createdById: true,
      courseOrderId: true,
      courseOrder: { select: { shippedAt: true, receivedAt: true } },
    },
  })
  if (!invite) return { success: false, message: '找不到課程' }
  if (invite.createdById !== session.user.id) {
    return { success: false, message: '無權限' }
  }
  if (!invite.courseOrderId || !invite.courseOrder) {
    return { success: false, message: '尚未申請教材' }
  }
  if (!invite.courseOrder.shippedAt) {
    return { success: false, message: '教材尚未寄出' }
  }

  await prisma.courseOrder.update({
    where: { id: invite.courseOrderId },
    data: { receivedAt: new Date() },
  })

  revalidatePath(`/course/${inviteId}`)
  return { success: true, message: '已確認收件，可以開始上課了！' }
}
