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
import { courseOrderSchema, materialOrderSchema, adminMaterialOrderEditSchema } from '@/lib/schemas/course-order'
import { getEnrollmentMaterialSummary } from '@/lib/data/course-sessions'
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
 * 講師申請教材 — 建立或更新 CourseOrder 並關聯至 CourseInvite
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
        courseOrderId: true,
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

  // 若已有 CourseOrder，且已寄送（單一）或任一批次已寄送（多地址）則禁止修改
  if (invite.courseOrderId) {
    const existing = await prisma.courseOrder.findUnique({
      where: { id: invite.courseOrderId },
      select: { shippedAt: true, shipments: { select: { shippedAt: true } } },
    })
    if (existing?.shippedAt || existing?.shipments.some((s) => s.shippedAt)) {
      return { success: false, message: '教材已寄出，無法修改申請' }
    }
  }

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

    // 應寄本數以 server 端統計為權威，驗證各版本本數總和相等
    const summary = await getEnrollmentMaterialSummary(inviteId)
    const sumTrad = shipments.reduce((a, s) => a + s.traditionalQty, 0)
    const sumSimp = shipments.reduce((a, s) => a + s.simplifiedQty, 0)
    if (sumTrad !== summary.traditional || sumSimp !== summary.simplified) {
      return {
        success: false,
        message: `尚未分配完所有書籍（繁體 ${sumTrad}/${summary.traditional}、簡體 ${sumSimp}/${summary.simplified}）`,
      }
    }

    const orderData = {
      ...snapshot,
      shipMode: 'multiple' as ShipMode,
      // 多地址下訂單自身寄件欄位以第一筆為代表（deliveryMethod 為非空必填）
      deliveryMethod: shipments[0].deliveryMethod as DeliveryMethod,
      deliveryAddress: null,
      storeId: null,
      storeName: null,
    }

    const orderId = await prisma.$transaction(async (tx) => {
      let oid = invite.courseOrderId
      if (oid) {
        await tx.courseOrder.update({ where: { id: oid }, data: orderData })
        await tx.materialShipment.deleteMany({ where: { courseOrderId: oid } })
      } else {
        const created = await tx.courseOrder.create({ data: orderData })
        oid = created.id
        await tx.courseInvite.update({ where: { id: inviteId }, data: { courseOrderId: oid } })
      }
      await tx.materialShipment.createMany({
        data: shipments.map((s) => ({
          courseOrderId: oid!,
          deliveryMethod: s.deliveryMethod as DeliveryMethod,
          deliveryAddress: s.deliveryMethod === 'delivery' ? (s.deliveryAddress || null) : null,
          storeId: s.deliveryMethod !== 'delivery' ? (s.storeId || null) : null,
          storeName: s.deliveryMethod !== 'delivery' ? (s.storeName || null) : null,
          traditionalQty: s.traditionalQty,
          simplifiedQty: s.simplifiedQty,
        })),
      })
      return oid!
    })

    revalidatePath(`/course/${inviteId}`)
    return { success: true, message: '教材申請已送出（多地址）', data: { id: orderId } }
  }

  // ── 單一地址模式（現行流程）────────────────────────────
  const orderData = {
    ...snapshot,
    shipMode: 'single' as ShipMode,
    deliveryMethod: d.deliveryMethod as DeliveryMethod,
    deliveryAddress: d.deliveryMethod === 'delivery' ? (d.deliveryAddress || null) : null,
    storeId: (d.deliveryMethod === 'sevenEleven' || d.deliveryMethod === 'familyMart') ? (d.storeId || null) : null,
    storeName: (d.deliveryMethod === 'sevenEleven' || d.deliveryMethod === 'familyMart') ? (d.storeName || null) : null,
  }

  if (invite.courseOrderId) {
    // 更新現有 CourseOrder（若由多地址切回單一，清除殘留批次）
    const oid = invite.courseOrderId
    await prisma.$transaction(async (tx) => {
      await tx.courseOrder.update({ where: { id: oid }, data: orderData })
      await tx.materialShipment.deleteMany({ where: { courseOrderId: oid } })
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
 * 管理者確認單一寄送批次已寄送（多地址模式）
 * 全部批次皆寄送時，自動將 CourseOrder.shippedAt 設為最後批次時間
 */
export async function confirmShipmentBatch(shipmentId: number): Promise<ActionResponse> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, message: '請先登入' }

  const isAdmin =
    session.user.role === 'admin' || session.user.role === 'superadmin'
  if (!isAdmin) return { success: false, message: '無權限' }

  const shipment = await prisma.materialShipment.findUnique({
    where: { id: shipmentId },
    select: { shippedAt: true, courseOrderId: true },
  })
  if (!shipment) return { success: false, message: '找不到寄送批次' }
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

/**
 * 管理者編輯教材申請快照欄位
 */
export async function updateMaterialOrderAdmin(
  orderId: number,
  formData: Record<string, string>
): Promise<ActionResponse> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, message: '請先登入' }

  const isAdmin = session.user.role === 'admin' || session.user.role === 'superadmin'
  if (!isAdmin) return { success: false, message: '無權限' }

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
