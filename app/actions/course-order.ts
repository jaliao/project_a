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
import { materialOrderSchema } from '@/lib/schemas/course-order'
import type { OrderBookItemInput } from '@/lib/schemas/course-order'
import { getUnassignedBookItems } from '@/lib/data/material-items'
import { createNotification } from '@/app/actions/notification'
import type { MaterialVersion, PurchaseType, DeliveryMethod, ShipMode } from '@prisma/client'

type ActionResponse = {
  success: boolean
  message?: string
  data?: { id: number }
  errors?: Record<string, string[]>
}

/**
 * 講師/管理者申請教材 — 每次建立一筆「新的」CourseOrder 並關聯至 CourseInvite（支援一門課多筆訂單）
 * 書本清單由 client 送出：學員書可覆寫版本（不回寫 materialChoice）、可加購（不綁學員）；
 * 學員選版統計僅為參考依據，不作為數量上限
 */
export async function applyMaterialOrder(
  inviteId: number,
  formData: Record<string, unknown>
): Promise<ActionResponse> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, message: '請先登入' }

  // 確認是課程講師或管理者；購買人快照一律取課程講師資料（管理者代辦時 submittedById 記操作者）
  const invite = await prisma.courseInvite.findUnique({
    where: { id: inviteId },
    select: {
      createdById: true,
      courseDate: true,
      materialFinalizedAt: true,
      createdBy: {
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
      },
    },
  })
  if (!invite) return { success: false, message: '找不到課程' }
  if (invite.createdById !== session.user.id && !canAccessAdmin(session.user.roles)) {
    return { success: false, message: '無權限' }
  }
  if (invite.materialFinalizedAt) {
    return { success: false, message: '教材申請已完成，如需再申請請先重新開放申請' }
  }

  const parsed = materialOrderSchema.safeParse(formData)
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors }
  }

  const d = parsed.data
  const teacher = invite.createdBy

  // 快照：以課程講師資料自動帶入
  const churchOrg =
    teacher.churchType === 'church' ? (teacher.church?.name ?? '') :
    teacher.churchType === 'other' ? (teacher.churchOther ?? '') : ''

  // 共用快照欄位（書籍欄位改由送出項目推導，廢棄欄位填預設值）
  const snapshot = {
    buyerNameZh: teacher.realName || teacher.name || '（未填）',
    buyerNameEn: teacher.englishName || '',
    teacherName: teacher.realName || teacher.name || '',
    churchOrg,
    email: teacher.commEmail || teacher.email,
    phone: teacher.phone || '',
    courseDate: invite.courseDate || '無',
    materialVersion: 'traditional' as MaterialVersion,
    purchaseType: 'selfOnly' as PurchaseType,
    quantity: 0,
    taxId: d.taxId || null,
    submittedById: session.user.id,
  }

  // 學員書本項目可用範圍＝當下尚未被指派者（server 端重算，防並發重複申請）
  const unassigned = await getUnassignedBookItems(inviteId)
  const itemById = new Map(unassigned.map((i) => [i.enrollmentId, i]))
  const seen = new Set<number>()

  type ItemRow = { enrollmentId: number | null; bookName: string; version: string; studentName: string }
  // 解析送出項目 → 快照列；學員書驗證有效且不重複（跨地址共用 seen），版本以送出值為準
  const resolveItems = (inputs: OrderBookItemInput[]): ItemRow[] | null => {
    const rows: ItemRow[] = []
    for (const input of inputs) {
      if (input.kind === 'enrollment') {
        const it = itemById.get(input.enrollmentId)
        if (!it || seen.has(input.enrollmentId)) return null
        seen.add(input.enrollmentId)
        rows.push({ enrollmentId: it.enrollmentId, bookName: it.bookName, version: input.version, studentName: it.studentName })
      } else {
        rows.push({ enrollmentId: null, bookName: input.bookName?.trim() || '額外加購', version: input.version, studentName: '' })
      }
    }
    return rows
  }
  const countQty = (rows: ItemRow[]) => ({
    trad: rows.filter((r) => r.version === 'traditional').length,
    simp: rows.filter((r) => r.version === 'simplified').length,
    eng: rows.filter((r) => r.version === 'english').length,
  })

  // ── 多地址模式（逐本指派，含版本覆寫與加購）─────────────────────────
  if (d.shipMode === 'multiple') {
    const shipments = d.shipments ?? []
    if (shipments.length === 0) {
      return { success: false, message: '請至少新增一個寄送地址' }
    }

    // 逐地址解析項目（未指派的學員書＝本次不申請，不再要求全數指派）
    const perShipRows: ItemRow[][] = []
    for (const s of shipments) {
      const rows = resolveItems(s.items)
      if (!rows) return { success: false, message: '含無效、已申請或重複指派的書本項目，請重新整理後再試' }
      perShipRows.push(rows)
    }
    if (perShipRows.reduce((a, r) => a + r.length, 0) < 1) {
      return { success: false, message: '請至少申請 1 本教材' }
    }

    // 各地址由項目推導繁/簡/英本數
    const perShipQty = perShipRows.map(countQty)
    const sumTrad = perShipQty.reduce((a, q) => a + q.trad, 0)
    const sumSimp = perShipQty.reduce((a, q) => a + q.simp, 0)
    const sumEng = perShipQty.reduce((a, q) => a + q.eng, 0)

    const orderData = {
      ...snapshot,
      courseInviteId: inviteId,
      traditionalQty: sumTrad,
      simplifiedQty: sumSimp,
      englishQty: sumEng,
      shipMode: 'multiple' as ShipMode,
      // 多地址下訂單自身寄件欄位以第一筆為代表（deliveryMethod 為非空必填）
      deliveryMethod: shipments[0].deliveryMethod as DeliveryMethod,
      deliveryAddress: null,
      storeId: null,
      storeName: null,
    }

    const orderId = await prisma.$transaction(async (tx) => {
      const created = await tx.courseOrder.create({ data: orderData })
      for (let i = 0; i < shipments.length; i++) {
        const s = shipments[i]
        const ship = await tx.materialShipment.create({
          data: {
            courseOrderId: created.id,
            recipientName: s.recipientName,
            recipientPhone: s.recipientPhone,
            deliveryMethod: s.deliveryMethod as DeliveryMethod,
            deliveryAddress: s.deliveryMethod === 'delivery' ? (s.deliveryAddress || null) : null,
            storeId: s.deliveryMethod !== 'delivery' ? (s.storeId || null) : null,
            storeName: s.deliveryMethod !== 'delivery' ? (s.storeName || null) : null,
            traditionalQty: perShipQty[i].trad,
            simplifiedQty: perShipQty[i].simp,
            englishQty: perShipQty[i].eng,
          },
        })
        await tx.materialShipmentItem.createMany({
          data: perShipRows[i].map((r) => ({
            shipmentId: ship.id,
            enrollmentId: r.enrollmentId,
            bookName: r.bookName,
            version: r.version,
            studentName: r.studentName,
          })),
        })
      }
      return created.id
    })

    revalidatePath(`/course/${inviteId}`)
    return { success: true, message: '教材申請已送出（多地址）', data: { id: orderId } }
  }

  // ── 單一地址模式 ────────────────────────────
  // 單一地址＝本次送出勾選的書本項目（含版本覆寫與加購）寄至此處；為該訂單建立自身寄送批次與逐本項目
  const singleRows = resolveItems(d.items ?? [])
  if (!singleRows) {
    return { success: false, message: '含無效、已申請或重複的書本項目，請重新整理後再試' }
  }
  if (singleRows.length < 1) {
    return { success: false, message: '請至少申請 1 本教材' }
  }
  const { trad: singleTrad, simp: singleSimp, eng: singleEng } = countQty(singleRows)

  const orderData = {
    ...snapshot,
    traditionalQty: singleTrad,
    simplifiedQty: singleSimp,
    englishQty: singleEng,
    shipMode: 'single' as ShipMode,
    recipientName: d.recipientName?.trim() || teacher.realName || teacher.name || '',
    recipientPhone: d.recipientPhone?.trim() || teacher.phone || '',
    deliveryMethod: d.deliveryMethod as DeliveryMethod,
    deliveryAddress: d.deliveryMethod === 'delivery' ? (d.deliveryAddress || null) : null,
    storeId: (d.deliveryMethod === 'sevenEleven' || d.deliveryMethod === 'familyMart') ? (d.storeId || null) : null,
    storeName: (d.deliveryMethod === 'sevenEleven' || d.deliveryMethod === 'familyMart') ? (d.storeName || null) : null,
  }

  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.courseOrder.create({
      data: { ...orderData, courseInviteId: inviteId },
    })
    // 單一地址亦建立一個寄送批次（鏡射地址）＋逐本項目，記錄本訂單涵蓋的書
    const ship = await tx.materialShipment.create({
      data: {
        courseOrderId: created.id,
        recipientName: orderData.recipientName,
        recipientPhone: orderData.recipientPhone,
        deliveryMethod: orderData.deliveryMethod,
        deliveryAddress: orderData.deliveryAddress,
        storeId: orderData.storeId,
        storeName: orderData.storeName,
        traditionalQty: singleTrad,
        simplifiedQty: singleSimp,
        englishQty: singleEng,
      },
    })
    if (singleRows.length > 0) {
      await tx.materialShipmentItem.createMany({
        data: singleRows.map((r) => ({
          shipmentId: ship.id,
          enrollmentId: r.enrollmentId,
          bookName: r.bookName,
          version: r.version,
          studentName: r.studentName,
        })),
      })
    }
    return created
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
 * 管理者/工作人員更新某收件地址的內部備註
 * single 模式傳 { orderId }（存 CourseOrder.note）；multiple 模式傳 { shipmentId }（存對應 MaterialShipment.note）
 */
export async function updateMaterialAddressNote(
  target: { orderId: number } | { shipmentId: number },
  note: string
): Promise<ActionResponse> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, message: '請先登入' }
  if (!canAccessAdmin(session.user.roles)) return { success: false, message: '無權限' }

  const trimmed = note.trim()
  const value = trimmed.length > 0 ? trimmed : null

  if ('orderId' in target) {
    const order = await prisma.courseOrder.findUnique({
      where: { id: target.orderId },
      select: { id: true },
    })
    if (!order) return { success: false, message: '找不到申請記錄' }
    await prisma.courseOrder.update({ where: { id: target.orderId }, data: { note: value } })
  } else {
    const shipment = await prisma.materialShipment.findUnique({
      where: { id: target.shipmentId },
      select: { id: true },
    })
    if (!shipment) return { success: false, message: '找不到寄送地址' }
    await prisma.materialShipment.update({ where: { id: target.shipmentId }, data: { note: value } })
  }

  revalidatePath('/admin/materials')
  return { success: true, message: '已儲存備註' }
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
  if (
    !order.courseInvite ||
    (order.courseInvite.createdById !== session.user.id && !canAccessAdmin(session.user.roles))
  ) {
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
 * 老師取消教材訂單（限尚未回填匯款）：刪除訂單，連帶釋放其寄送批次與書本項目以重新申請
 */
export async function cancelCourseOrder(orderId: number): Promise<ActionResponse> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, message: '請先登入' }

  const order = await prisma.courseOrder.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      paymentReportedAt: true,
      courseInvite: { select: { id: true, createdById: true } },
    },
  })
  if (!order || !order.courseInvite) return { success: false, message: '找不到訂單' }
  if (order.courseInvite.createdById !== session.user.id && !canAccessAdmin(session.user.roles)) {
    return { success: false, message: '無權限' }
  }
  if (order.paymentReportedAt) return { success: false, message: '已回填匯款，無法取消申請' }

  // 刪除訂單（cascade 刪其 MaterialShipment 與 MaterialShipmentItem → 書本回到未指派）
  await prisma.courseOrder.delete({ where: { id: orderId } })

  revalidatePath(`/course/${order.courseInvite.id}`)
  revalidatePath('/admin/materials')
  return { success: true, message: '已取消申請，可重新申請教材' }
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
      `「${courseTitle}」教材費用為 NT$${amount}，請匯款至：\n${account}\n完成後請回填匯款後五碼。`
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
  if (
    !order.courseInvite ||
    (order.courseInvite.createdById !== session.user.id && !canAccessAdmin(session.user.roles))
  ) {
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
 * 完成/重新開放教材申請共用：授權（講師或管理者）與課程狀態檢核，回傳課程與操作者快照
 */
async function loadInviteForMaterialFinalize(
  inviteId: number,
  userId: string,
  roles: readonly string[] | null | undefined
) {
  const [invite, actor] = await Promise.all([
    prisma.courseInvite.findUnique({
      where: { id: inviteId },
      select: {
        id: true,
        title: true,
        createdById: true,
        startedAt: true,
        cancelledAt: true,
        completedAt: true,
        materialFinalizedAt: true,
      },
    }),
    prisma.user.findUnique({ where: { id: userId }, select: { realName: true, name: true, email: true } }),
  ])
  if (!invite) return { error: '找不到課程' as const }
  if (invite.createdById !== userId && !canAccessAdmin(roles)) {
    return { error: '無權限' as const }
  }
  if (invite.startedAt) return { error: '課程已開始上課，無法操作' as const }
  if (invite.cancelledAt) return { error: '課程已取消' as const }
  if (invite.completedAt) return { error: '課程已結業' as const }
  const actorName = actor?.realName || actor?.name || actor?.email || '操作者'
  return { invite, actorName }
}

/**
 * 講師/管理者標記「教材申請已完成」：不需（再）申請教材，開課門檻豁免教材需求條件
 */
export async function finalizeMaterialOrders(inviteId: number): Promise<ActionResponse> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, message: '請先登入' }

  const loaded = await loadInviteForMaterialFinalize(inviteId, session.user.id, session.user.roles)
  if ('error' in loaded) return { success: false, message: loaded.error }
  const { invite, actorName } = loaded
  if (invite.materialFinalizedAt) return { success: false, message: '教材申請已標記完成' }

  // 前置條件：不可有進行中（尚未收件）的教材訂單
  const activeOrders = await prisma.courseOrder.count({
    where: { courseInviteId: inviteId, receivedAt: null },
  })
  if (activeOrders > 0) {
    return { success: false, message: '尚有進行中的教材訂單，請先完成收件後再標記已完成申請' }
  }

  await prisma.$transaction(async (tx) => {
    await tx.courseInvite.update({
      where: { id: inviteId },
      data: { materialFinalizedAt: new Date() },
    })
    // 課程操作紀錄（同交易）
    await tx.adminActionLog.create({
      data: {
        action: 'material_finalize',
        actorId: session.user.id,
        inviteId,
        actorName,
        targetName: '',
        inviteTitle: `#${invite.id} ${invite.title}`,
      },
    })
  })

  revalidatePath(`/course/${inviteId}`)
  return { success: true, message: '已完成教材申請' }
}

/**
 * 講師/管理者重新開放教材申請（清除完成標記，恢復可申請）
 */
export async function reopenMaterialOrders(inviteId: number): Promise<ActionResponse> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, message: '請先登入' }

  const loaded = await loadInviteForMaterialFinalize(inviteId, session.user.id, session.user.roles)
  if ('error' in loaded) return { success: false, message: loaded.error }
  const { invite, actorName } = loaded
  if (!invite.materialFinalizedAt) return { success: false, message: '教材申請尚未標記完成' }

  await prisma.$transaction(async (tx) => {
    await tx.courseInvite.update({
      where: { id: inviteId },
      data: { materialFinalizedAt: null },
    })
    await tx.adminActionLog.create({
      data: {
        action: 'material_reopen',
        actorId: session.user.id,
        inviteId,
        actorName,
        targetName: '',
        inviteTitle: `#${invite.id} ${invite.title}`,
      },
    })
  })

  revalidatePath(`/course/${inviteId}`)
  return { success: true, message: '已重新開放教材申請' }
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
