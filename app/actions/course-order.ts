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
import { canAccessAdmin } from '@/lib/auth-roles'
import { courseOrderSchema, materialOrderSchema, adminMaterialOrderEditSchema } from '@/lib/schemas/course-order'
import { createNotification } from '@/app/actions/notification'
import type { MaterialVersion, PurchaseType, DeliveryMethod, ShipMode } from '@prisma/client'

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
 * 講師申請教材 — 每次建立一筆「新的」CourseOrder 並關聯至 CourseInvite（支援一門課多筆訂單）
 */
export async function applyMaterialOrder(
  inviteId: number,
  formData: Record<string, unknown>
): Promise<ActionResponse> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, message: '請先登入' }

  // 確認是課程講師，同時取得快照所需資料
  const [invite, user] = await Promise.all([
    prisma.courseInvite.findUnique({
      where: { id: inviteId },
      select: {
        createdById: true,
        courseDate: true,
        createdBy: { select: { realName: true, name: true } },
      },
    }),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        realName: true,
        englishName: true,
        name: true,
        commEmail: true,
        email: true,
        phone: true,
        churchType: true,
        churchOther: true,
        church: { select: { name: true } },
      },
    }),
  ])
  if (!invite) return { success: false, message: '找不到課程' }
  if (invite.createdById !== session.user.id) {
    return { success: false, message: '無權限' }
  }
  if (!user) return { success: false, message: '找不到會員資料' }

  const parsed = materialOrderSchema.safeParse(formData)
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors }
  }

  const d = parsed.data

  // 快照：從會員與課程資料自動帶入
  const churchOrg =
    user.churchType === 'church' ? (user.church?.name ?? '') :
    user.churchType === 'other' ? (user.churchOther ?? '') : ''

  // 共用快照欄位（書籍欄位改由學員 materialChoice 統計，廢棄欄位填預設值）
  const snapshot = {
    buyerNameZh: user.realName || user.name || '（未填）',
    buyerNameEn: user.englishName || '',
    teacherName: invite.createdBy.realName || invite.createdBy.name || '',
    churchOrg,
    email: user.commEmail || user.email,
    phone: user.phone || '',
    courseDate: invite.courseDate || '無',
    materialVersion: 'traditional' as MaterialVersion,
    purchaseType: 'selfOnly' as PurchaseType,
    quantity: 0,
    taxId: d.taxId || null,
    submittedById: session.user.id,
  }

  // ── 多地址模式 ──────────────────────────────────────────
  if (d.shipMode === 'multiple') {
    const shipments = d.shipments ?? []
    if (shipments.length === 0) {
      return { success: false, message: '請至少新增一個寄送地址' }
    }

    // 多訂單下每筆訂單自填本數（放寬「總和需等於課程總計」驗證）：至少分配 1 本
    const sumTrad = shipments.reduce((a, s) => a + s.traditionalQty, 0)
    const sumSimp = shipments.reduce((a, s) => a + s.simplifiedQty, 0)
    if (sumTrad + sumSimp < 1) {
      return { success: false, message: '請至少分配 1 本教材' }
    }

    const orderData = {
      ...snapshot,
      courseInviteId: inviteId,
      shipMode: 'multiple' as ShipMode,
      // 多地址下訂單自身寄件欄位以第一筆為代表（deliveryMethod 為非空必填）
      deliveryMethod: shipments[0].deliveryMethod as DeliveryMethod,
      deliveryAddress: null,
      storeId: null,
      storeName: null,
    }

    const orderId = await prisma.$transaction(async (tx) => {
      const created = await tx.courseOrder.create({ data: orderData })
      await tx.materialShipment.createMany({
        data: shipments.map((s) => ({
          courseOrderId: created.id,
          recipientName: s.recipientName,
          recipientPhone: s.recipientPhone,
          deliveryMethod: s.deliveryMethod as DeliveryMethod,
          deliveryAddress: s.deliveryMethod === 'delivery' ? (s.deliveryAddress || null) : null,
          storeId: s.deliveryMethod !== 'delivery' ? (s.storeId || null) : null,
          storeName: s.deliveryMethod !== 'delivery' ? (s.storeName || null) : null,
          traditionalQty: s.traditionalQty,
          simplifiedQty: s.simplifiedQty,
        })),
      })
      return created.id
    })

    revalidatePath(`/course/${inviteId}`)
    return { success: true, message: '教材申請已送出（多地址）', data: { id: orderId } }
  }

  // ── 單一地址模式（現行流程）────────────────────────────
  // 收件人預設帶入申請講師（姓名 + 個人資料電話），講師可於表單修改
  const orderData = {
    ...snapshot,
    shipMode: 'single' as ShipMode,
    recipientName: d.recipientName?.trim() || invite.createdBy.realName || invite.createdBy.name || '',
    recipientPhone: d.recipientPhone?.trim() || user.phone || '',
    deliveryMethod: d.deliveryMethod as DeliveryMethod,
    deliveryAddress: d.deliveryMethod === 'delivery' ? (d.deliveryAddress || null) : null,
    storeId: (d.deliveryMethod === 'sevenEleven' || d.deliveryMethod === 'familyMart') ? (d.storeId || null) : null,
    storeName: (d.deliveryMethod === 'sevenEleven' || d.deliveryMethod === 'familyMart') ? (d.storeName || null) : null,
  }

  // 每次申請建立一筆新的 CourseOrder 並關聯至課程
  const order = await prisma.courseOrder.create({
    data: { ...orderData, courseInviteId: inviteId },
  })
  revalidatePath(`/course/${inviteId}`)
  return { success: true, message: '教材申請已送出', data: { id: order.id } }
}

/**
 * 管理者確認已寄送教材
 */
export async function confirmShipment(orderId: number): Promise<ActionResponse> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, message: '請先登入' }

  if (!canAccessAdmin(session.user.roles)) return { success: false, message: '無權限' }

  const order = await prisma.courseOrder.findUnique({
    where: { id: orderId },
    select: { shippedAt: true, paymentConfirmedAt: true },
  })
  if (!order) return { success: false, message: '找不到申請記錄' }
  if (!order.paymentConfirmedAt) return { success: false, message: '尚未確認收款' }
  if (order.shippedAt) return { success: false, message: '已標記為寄送中' }

  await prisma.courseOrder.update({
    where: { id: orderId },
    data: { shippedAt: new Date() },
  })

  revalidatePath('/admin/materials')
  return { success: true, message: '已標記為已寄送' }
}

/**
 * 管理者確認單一寄送批次已寄送（多地址模式）
 * 全部批次皆寄送時，自動將 CourseOrder.shippedAt 設為最後批次時間
 */
export async function confirmShipmentBatch(shipmentId: number): Promise<ActionResponse> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, message: '請先登入' }

  if (!canAccessAdmin(session.user.roles)) return { success: false, message: '無權限' }

  const shipment = await prisma.materialShipment.findUnique({
    where: { id: shipmentId },
    select: { shippedAt: true, courseOrderId: true, courseOrder: { select: { paymentConfirmedAt: true } } },
  })
  if (!shipment) return { success: false, message: '找不到寄送批次' }
  if (!shipment.courseOrder.paymentConfirmedAt) return { success: false, message: '尚未確認收款' }
  if (shipment.shippedAt) return { success: false, message: '此批次已標記為已寄送' }

  const now = new Date()
  await prisma.$transaction(async (tx) => {
    await tx.materialShipment.update({ where: { id: shipmentId }, data: { shippedAt: now } })
    // 若該訂單所有批次皆已寄送，標記訂單整體已寄送
    const remaining = await tx.materialShipment.count({
      where: { courseOrderId: shipment.courseOrderId, shippedAt: null },
    })
    if (remaining === 0) {
      await tx.courseOrder.update({
        where: { id: shipment.courseOrderId },
        data: { shippedAt: now },
      })
    }
  })

  revalidatePath('/admin/materials')
  return { success: true, message: '已標記此批次為已寄送' }
}

/**
 * 講師確認收件（針對單一教材訂單）
 */
export async function confirmReceipt(orderId: number): Promise<ActionResponse> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, message: '請先登入' }

  const order = await prisma.courseOrder.findUnique({
    where: { id: orderId },
    select: {
      shippedAt: true,
      receivedAt: true,
      courseInvite: { select: { id: true, createdById: true } },
    },
  })
  if (!order) return { success: false, message: '找不到教材訂單' }
  if (!order.courseInvite || order.courseInvite.createdById !== session.user.id) {
    return { success: false, message: '無權限' }
  }
  if (!order.shippedAt) {
    return { success: false, message: '教材尚未寄出' }
  }

  await prisma.courseOrder.update({
    where: { id: orderId },
    data: { receivedAt: new Date() },
  })

  revalidatePath(`/course/${order.courseInvite.id}`)
  return { success: true, message: '已確認收件' }
}

/**
 * 管理者編輯教材申請快照欄位
 */
export async function updateMaterialOrderAdmin(
  orderId: number,
  formData: Record<string, string>
): Promise<ActionResponse> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, message: '請先登入' }

  if (!canAccessAdmin(session.user.roles)) return { success: false, message: '無權限' }

  const parsed = adminMaterialOrderEditSchema.safeParse(formData)
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors }
  }

  const order = await prisma.courseOrder.findUnique({
    where: { id: orderId },
    select: { id: true },
  })
  if (!order) return { success: false, message: '找不到申請記錄' }

  const d = parsed.data
  await prisma.courseOrder.update({
    where: { id: orderId },
    data: {
      buyerNameZh: d.buyerNameZh,
      buyerNameEn: d.buyerNameEn,
      teacherName: d.teacherName,
      churchOrg: d.churchOrg,
      email: d.email,
      phone: d.phone,
      courseDate: d.courseDate,
      taxId: d.taxId || null,
    },
  })

  revalidatePath('/admin/materials')
  return { success: true, message: '已更新申請資料' }
}

/**
 * 管理者批價：填寫金額與匯款帳號，通知老師繳費
 */
export async function quoteMaterialOrder(
  orderId: number,
  input: { amount: number; account: string }
): Promise<ActionResponse> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, message: '請先登入' }
  if (!canAccessAdmin(session.user.roles)) return { success: false, message: '無權限' }

  const amount = Math.trunc(Number(input.amount))
  const account = (input.account ?? '').trim()
  if (!Number.isFinite(amount) || amount <= 0) {
    return { success: false, errors: { amount: ['請輸入正整數金額'] } }
  }
  if (!account) {
    return { success: false, errors: { account: ['匯款帳號為必填'] } }
  }

  const order = await prisma.courseOrder.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      submittedById: true,
      courseInvite: { select: { createdById: true, title: true } },
    },
  })
  if (!order) return { success: false, message: '找不到申請記錄' }

  await prisma.courseOrder.update({
    where: { id: orderId },
    data: { quotedAmount: amount, remittanceAccount: account, quotedAt: new Date() },
  })

  // 通知老師（提交者；fallback 課程建立者）
  const teacherId = order.submittedById ?? order.courseInvite?.createdById
  if (teacherId) {
    const courseTitle = order.courseInvite?.title ?? '教材申請'
    await createNotification(
      teacherId,
      '教材批價完成，請繳費',
      `「${courseTitle}」教材費用為 NT$${amount}，請匯款至 ${account}，完成後回填匯款後五碼。`
    )
  }

  revalidatePath('/admin/materials')
  return { success: true, message: '已批價並通知老師' }
}

/**
 * 老師回填匯款後五碼
 */
export async function reportMaterialPayment(
  orderId: number,
  last5: string
): Promise<ActionResponse> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, message: '請先登入' }

  const order = await prisma.courseOrder.findUnique({
    where: { id: orderId },
    select: {
      quotedAt: true,
      courseInvite: { select: { id: true, createdById: true } },
    },
  })
  if (!order) return { success: false, message: '找不到教材訂單' }
  if (!order.courseInvite || order.courseInvite.createdById !== session.user.id) {
    return { success: false, message: '無權限' }
  }
  if (!order.quotedAt) return { success: false, message: '尚未批價' }

  const digits = (last5 ?? '').trim()
  if (!/^\d{5}$/.test(digits)) {
    return { success: false, errors: { last5: ['請輸入 5 位數字'] } }
  }

  await prisma.courseOrder.update({
    where: { id: orderId },
    data: { paymentLast5: digits, paymentReportedAt: new Date() },
  })

  revalidatePath(`/course/${order.courseInvite.id}`)
  return { success: true, message: '已回填匯款資訊，等待管理者確認收款' }
}

/**
 * 管理者確認收款：解鎖寄送
 */
export async function confirmMaterialPayment(orderId: number): Promise<ActionResponse> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, message: '請先登入' }
  if (!canAccessAdmin(session.user.roles)) return { success: false, message: '無權限' }

  const order = await prisma.courseOrder.findUnique({
    where: { id: orderId },
    select: {
      paymentReportedAt: true,
      paymentConfirmedAt: true,
      submittedById: true,
      courseInvite: { select: { createdById: true, title: true } },
    },
  })
  if (!order) return { success: false, message: '找不到申請記錄' }
  if (!order.paymentReportedAt) return { success: false, message: '老師尚未回填匯款資訊' }
  if (order.paymentConfirmedAt) return { success: false, message: '已確認收款' }

  await prisma.courseOrder.update({
    where: { id: orderId },
    data: { paymentConfirmedAt: new Date() },
  })

  const teacherId = order.submittedById ?? order.courseInvite?.createdById
  if (teacherId) {
    const courseTitle = order.courseInvite?.title ?? '教材申請'
    await createNotification(
      teacherId,
      '款項已確認',
      `「${courseTitle}」已確認收款，將安排寄送教材。`
    )
  }

  revalidatePath('/admin/materials')
  return { success: true, message: '已確認收款' }
}
