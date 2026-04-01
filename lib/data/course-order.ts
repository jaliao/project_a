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
  shippedAt: Date | null
  receivedAt: Date | null
  createdAt: Date
}

export type CourseOrderWithInvite = CourseOrderDetail & {
  inviteId: number | null
  inviteTitle: string | null
  instructorName: string | null
  instructorEmail: string | null
}

export type CourseOrderForPrint = {
  id: number
  buyerNameZh: string
  teacherName: string
  deliveryMethod: string
  deliveryAddress: string | null
  courseDate: string
  taxId: string | null
  shippedAt: Date | null
  inviteId: number | null
  inviteTitle: string | null
}

/**
 * 取得指定 CourseInvite 的 CourseOrder（含寄送狀態）
 */
export async function getCourseOrderByInviteId(
  inviteId: number
): Promise<CourseOrderDetail | null> {
  const invite = await prisma.courseInvite.findUnique({
    where: { id: inviteId },
    select: {
      courseOrder: {
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
          shippedAt: true,
          receivedAt: true,
          createdAt: true,
        },
      },
    },
  })

  if (!invite?.courseOrder) return null
  return invite.courseOrder as CourseOrderDetail
}

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
      shippedAt: true,
      receivedAt: true,
      createdAt: true,
      courseInvites: {
        take: 1,
        select: {
          id: true,
          title: true,
          createdBy: { select: { realName: true, name: true, email: true } },
        },
      },
    },
  })

  return orders.map((order) => {
    const invite = order.courseInvites[0]
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
      shippedAt: order.shippedAt,
      receivedAt: order.receivedAt,
      createdAt: order.createdAt,
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
      deliveryMethod: true,
      deliveryAddress: true,
      courseDate: true,
      taxId: true,
      shippedAt: true,
      courseInvites: {
        take: 1,
        select: { id: true, title: true },
      },
    },
  })

  if (!order) return null

  const invite = order.courseInvites[0]
  return {
    id: order.id,
    buyerNameZh: order.buyerNameZh,
    teacherName: order.teacherName,
    deliveryMethod: order.deliveryMethod,
    deliveryAddress: order.deliveryAddress,
    courseDate: order.courseDate,
    taxId: order.taxId,
    shippedAt: order.shippedAt,
    inviteId: invite?.id ?? null,
    inviteTitle: invite?.title ?? null,
  }
}
