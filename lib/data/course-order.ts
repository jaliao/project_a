/*
 * ----------------------------------------------
 * Data Layer - 課程訂購查詢
 * 2026-03-30
 * lib/data/course-order.ts
 * ----------------------------------------------
 */

import { prisma } from '@/lib/prisma'

export type CourseOrderDetail = {
  id: number
  buyerNameZh: string
  buyerNameEn: string
  teacherName: string
  churchOrg: string
  email: string
  phone: string
  materialVersion: string
  purchaseType: string
  studentNames: string | null
  quantity: number
  quantityNote: string | null
  courseDate: string
  taxId: string | null
  deliveryMethod: string
  deliveryAddress: string | null
  storeId: string | null
  storeName: string | null
  quotedAmount: number | null
  remittanceAccount: string | null
  quotedAt: Date | null
  paymentLast5: string | null
  paymentReportedAt: Date | null
  paymentConfirmedAt: Date | null
  shippedAt: Date | null
  receivedAt: Date | null
  traditionalQty: number
  simplifiedQty: number
  createdAt: Date
}

export type ShipmentInfo = {
  id: number
  recipientName: string | null
  recipientPhone: string | null
  deliveryMethod: string
  deliveryAddress: string | null
  storeId: string | null
  storeName: string | null
  traditionalQty: number
  simplifiedQty: number
  shippedAt: Date | null
}

export type CourseOrderWithInvite = CourseOrderDetail & {
  inviteId: number | null
  inviteTitle: string | null
  instructorName: string | null
  instructorEmail: string | null
  shipMode: string
  shipments: ShipmentInfo[]
}

export type CourseOrderForPrint = {
  id: number
  buyerNameZh: string
  teacherName: string
  recipientName: string | null
  recipientPhone: string | null
  deliveryMethod: string
  deliveryAddress: string | null
  storeId: string | null
  storeName: string | null
  courseDate: string
  taxId: string | null
  shippedAt: Date | null
  traditionalQty: number
  simplifiedQty: number
  inviteId: number | null
  inviteTitle: string | null
  catalogLabel: string | null
  shipMode: string
  shipments: ShipmentInfo[]
}

// 共用 Prisma select：寄送批次欄位
const shipmentSelect = {
  id: true,
  recipientName: true,
  recipientPhone: true,
  deliveryMethod: true,
  deliveryAddress: true,
  storeId: true,
  storeName: true,
  traditionalQty: true,
  simplifiedQty: true,
  shippedAt: true,
} as const

/**
 * 取得所有 CourseOrder 及關聯的 CourseInvite 資訊（後台管理列表用）
 */
export async function getAllCourseOrdersWithInvite(): Promise<
  CourseOrderWithInvite[]
> {
  const orders = await prisma.courseOrder.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      buyerNameZh: true,
      buyerNameEn: true,
      teacherName: true,
      churchOrg: true,
      email: true,
      phone: true,
      materialVersion: true,
      purchaseType: true,
      studentNames: true,
      quantity: true,
      quantityNote: true,
      courseDate: true,
      taxId: true,
      deliveryMethod: true,
      deliveryAddress: true,
      storeId: true,
      storeName: true,
      quotedAmount: true,
      remittanceAccount: true,
      quotedAt: true,
      paymentLast5: true,
      paymentReportedAt: true,
      paymentConfirmedAt: true,
      shippedAt: true,
      receivedAt: true,
      traditionalQty: true,
      simplifiedQty: true,
      createdAt: true,
      shipMode: true,
      shipments: { select: shipmentSelect, orderBy: { id: 'asc' } },
      courseInvite: {
        select: {
          id: true,
          title: true,
          createdBy: { select: { realName: true, name: true, email: true } },
        },
      },
    },
  })

  return orders.map((order) => {
    const invite = order.courseInvite
    return {
      id: order.id,
      buyerNameZh: order.buyerNameZh,
      buyerNameEn: order.buyerNameEn,
      teacherName: order.teacherName,
      churchOrg: order.churchOrg,
      email: order.email,
      phone: order.phone,
      materialVersion: order.materialVersion,
      purchaseType: order.purchaseType,
      studentNames: order.studentNames,
      quantity: order.quantity,
      quantityNote: order.quantityNote,
      courseDate: order.courseDate,
      taxId: order.taxId,
      deliveryMethod: order.deliveryMethod,
      deliveryAddress: order.deliveryAddress,
      storeId: order.storeId,
      storeName: order.storeName,
      quotedAmount: order.quotedAmount,
      remittanceAccount: order.remittanceAccount,
      quotedAt: order.quotedAt,
      paymentLast5: order.paymentLast5,
      paymentReportedAt: order.paymentReportedAt,
      paymentConfirmedAt: order.paymentConfirmedAt,
      shippedAt: order.shippedAt,
      receivedAt: order.receivedAt,
      traditionalQty: order.traditionalQty,
      simplifiedQty: order.simplifiedQty,
      createdAt: order.createdAt,
      shipMode: order.shipMode,
      shipments: order.shipments,
      inviteId: invite?.id ?? null,
      inviteTitle: invite?.title ?? null,
      instructorName:
        invite?.createdBy.realName ?? invite?.createdBy.name ?? null,
      instructorEmail: invite?.createdBy.email ?? null,
    }
  })
}

/**
 * 取得單筆 CourseOrder 出貨單資料（列印頁用）
 */
export async function getCourseOrderForPrint(
  orderId: number
): Promise<CourseOrderForPrint | null> {
  const order = await prisma.courseOrder.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      buyerNameZh: true,
      teacherName: true,
      recipientName: true,
      recipientPhone: true,
      deliveryMethod: true,
      deliveryAddress: true,
      storeId: true,
      storeName: true,
      courseDate: true,
      taxId: true,
      shippedAt: true,
      traditionalQty: true,
      simplifiedQty: true,
      shipMode: true,
      shipments: { select: shipmentSelect, orderBy: { id: 'asc' } },
      courseInvite: {
        select: {
          id: true,
          title: true,
          courseCatalog: { select: { label: true } },
        },
      },
    },
  })

  if (!order) return null

  const invite = order.courseInvite
  return {
    id: order.id,
    buyerNameZh: order.buyerNameZh,
    teacherName: order.teacherName,
    recipientName: order.recipientName,
    recipientPhone: order.recipientPhone,
    deliveryMethod: order.deliveryMethod,
    deliveryAddress: order.deliveryAddress,
    storeId: order.storeId,
    storeName: order.storeName,
    courseDate: order.courseDate,
    taxId: order.taxId,
    shippedAt: order.shippedAt,
    traditionalQty: order.traditionalQty,
    simplifiedQty: order.simplifiedQty,
    shipMode: order.shipMode,
    shipments: order.shipments,
    inviteId: invite?.id ?? null,
    inviteTitle: invite?.title ?? null,
    catalogLabel: invite?.courseCatalog?.label ?? null,
  }
}
