/*
 * ----------------------------------------------
 * Server Actions - 課程邀請
 * 2026-03-23
 * app/actions/course-invite.ts
 * ----------------------------------------------
 */

'use server'

import { randomBytes } from 'crypto'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { createInviteSchema } from '@/lib/schemas/course-invite'

type ActionResponse<T = undefined> = {
  success: boolean
  message?: string
  data?: T
  errors?: Record<string, string[]>
}

// ── 建立開課邀請 ──────────────────────────────
export async function createInvite(
  formData: Record<string, string>
): Promise<ActionResponse<{ id: number; token: string }>> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, message: '請先登入' }

  const parsed = createInviteSchema.safeParse(formData)
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors }
  }

  const { title, maxCount, courseOrderId } = parsed.data
  const token = randomBytes(6).toString('hex') // 12-char hex

  const invite = await prisma.courseInvite.create({
    data: {
      token,
      title,
      maxCount,
      courseOrderId: courseOrderId ?? null,
      createdById: session.user.id,
    },
  })

  return {
    success: true,
    message: '邀請已建立',
    data: { id: invite.id, token: invite.token },
  }
}

// ── 學員透過 token 加入邀請 ────────────────────
export async function joinInvite(
  token: string
): Promise<ActionResponse<{ inviteTitle: string }>> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, message: '請先登入' }

  const invite = await prisma.courseInvite.findUnique({ where: { token } })
  if (!invite) return { success: false, message: '邀請連結無效或已失效' }

  // upsert：已加入則忽略
  await prisma.inviteEnrollment.upsert({
    where: {
      inviteId_userId: { inviteId: invite.id, userId: session.user.id },
    },
    create: { inviteId: invite.id, userId: session.user.id },
    update: {},
  })

  return {
    success: true,
    data: { inviteTitle: invite.title },
  }
}

// ── 查詢當前使用者建立的邀請列表 ──────────────
export async function getMyInvites() {
  const session = await auth()
  if (!session?.user?.id) return []

  return prisma.courseInvite.findMany({
    where: { createdById: session.user.id },
    orderBy: { createdAt: 'desc' },
    include: {
      courseOrder: { select: { id: true, buyerNameZh: true, courseDate: true } },
      enrollments: {
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
        orderBy: { joinedAt: 'asc' },
      },
    },
  })
}

// ── 查詢當前使用者的 CourseOrder 清單（供建立邀請選單用）──
export async function getMyOrders() {
  const session = await auth()
  if (!session?.user?.id) return []

  return prisma.courseOrder.findMany({
    where: { submittedById: session.user.id },
    orderBy: { createdAt: 'desc' },
    select: { id: true, buyerNameZh: true, courseDate: true },
  })
}
