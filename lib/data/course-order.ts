/*
 * ----------------------------------------------
 * Data Layer - 課程訂購查詢
 * 2026-03-30
 * lib/data/course-order.ts
 * ----------------------------------------------
 */

import { prisma } from '@/lib/prisma'
import { getMaterialOrderStatusKey } from '@/lib/utils/material-order-status'

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
  recipientName: string | null
  recipientPhone: string | null
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
  englishQty: number
  createdAt: Date
  note: string | null // 內部備註（單一地址）
}

export type ShipmentItemInfo = {
  enrollmentId: number | null // 額外加購項目為 null
  bookName: string
  version: string // traditional / simplified
  studentName: string // 學員名稱快照
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
  englishQty: number
  shippedAt: Date | null
  note: string | null // 內部備註（此收件地址）
  items: ShipmentItemInfo[] // 指派至此地址的書本項目
}

// 單一地址書本清單（由課程報名推導）
export type OrderBookItem = { studentName: string; bookName: string; version: string }

export type CourseOrderWithInvite = CourseOrderDetail & {
  inviteId: number | null
  inviteTitle: string | null
  inviteCancelledAt: Date | null
  instructorName: string | null
  instructorEmail: string | null
  shipMode: string
  shipments: ShipmentInfo[]
  bookItems: OrderBookItem[] // 單一地址書本清單（多地址為空，改用 shipments[].items）
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
  englishQty: number
  inviteId: number | null
  inviteTitle: string | null
  catalogLabel: string | null
  shipMode: string
  shipments: ShipmentInfo[]
  note: string | null // 內部備註（單一地址）
  bookItems: OrderBookItem[] // 單一地址書本清單
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
  englishQty: true,
  shippedAt: true,
  note: true,
  items: { select: { enrollmentId: true, bookName: true, version: true, studentName: true } },
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
      recipientName: true,
      recipientPhone: true,
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
      englishQty: true,
      createdAt: true,
      note: true,
      shipMode: true,
      shipments: { select: shipmentSelect, orderBy: { id: 'asc' } },
      courseInvite: {
        select: {
          id: true,
          title: true,
          cancelledAt: true,
          createdBy: { select: { realName: true, name: true, email: true } },
        },
      },
    },
  })

  const mapped = orders.map((order) => {
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
      recipientName: order.recipientName,
      recipientPhone: order.recipientPhone,
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
      englishQty: order.englishQty,
      createdAt: order.createdAt,
      note: order.note,
      shipMode: order.shipMode,
      shipments: order.shipments,
      inviteId: invite?.id ?? null,
      inviteTitle: invite?.title ?? null,
      inviteCancelledAt: invite?.cancelledAt ?? null,
      instructorName:
        invite?.createdBy.realName ?? invite?.createdBy.name ?? null,
      instructorEmail: invite?.createdBy.email ?? null,
      // 單一地址：書本清單＝該訂單自身寄送批次之項目（精準對應本訂單）
      bookItems:
        order.shipMode === 'single'
          ? order.shipments.flatMap((s) =>
              s.items.map((i) => ({ studentName: i.studentName, bookName: i.bookName, version: i.version }))
            )
          : ([] as OrderBookItem[]),
    }
  })

  return mapped
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
      englishQty: true,
      note: true,
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
  // 單一地址：書本清單＝該訂單自身寄送批次之項目
  const bookItems: OrderBookItem[] =
    order.shipMode === 'single'
      ? order.shipments.flatMap((s) =>
          s.items.map((i) => ({ studentName: i.studentName, bookName: i.bookName, version: i.version }))
        )
      : []
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
    englishQty: order.englishQty,
    shipMode: order.shipMode,
    shipments: order.shipments,
    note: order.note,
    inviteId: invite?.id ?? null,
    inviteTitle: invite?.title ?? null,
    catalogLabel: invite?.courseCatalog?.label ?? null,
    bookItems,
  }
}

/**
 * 教材待辦筆數（管理者待處理：待批價／待確認收款／待寄送）
 * 與教材列表狀態推導共用 getMaterialOrderStatusKey。
 */
export async function getMaterialTodoCount(): Promise<number> {
  const orders = await prisma.courseOrder.findMany({
    select: {
      quotedAt: true,
      paymentReportedAt: true,
      paymentConfirmedAt: true,
      shippedAt: true,
      receivedAt: true,
    },
  })
  const todo = new Set(['pending_quote', 'pending_confirm', 'pending_ship'])
  return orders.filter((o) => todo.has(getMaterialOrderStatusKey(o))).length
}
