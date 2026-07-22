/*
 * ----------------------------------------------
 * Server Actions - 聯繫管理者（學員提問）
 * 2026-07-22
 * app/actions/support-inquiry.ts
 * ----------------------------------------------
 */

'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { canAccessAdmin } from '@/lib/auth-roles'
import { createInquirySchema, replyInquirySchema } from '@/lib/schemas/support-inquiry'
import { createNotification } from '@/app/actions/notification'

type ActionResponse = {
  success: boolean
  message?: string
  errors?: Record<string, string[]>
}

async function requireAdmin() {
  const session = await auth()
  if (!session?.user?.id) return { ok: false as const, res: { success: false, message: '請先登入' } }
  if (!canAccessAdmin(session.user.roles))
    return { ok: false as const, res: { success: false, message: '無權限' } }
  return { ok: true as const, adminId: session.user.id }
}

function revalidateAdmin() {
  revalidatePath('/admin/support-inquiries')
  revalidatePath('/admin')
}

function revalidateUserInquiries() {
  revalidatePath('/[locale]/user/[spiritId]/inquiries', 'page')
}

// ── 學員：送出提問 ──
export async function submitInquiry(formData: Record<string, unknown>): Promise<ActionResponse> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, message: '請先登入' }

  const parsed = createInquirySchema.safeParse(formData)
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors }
  }
  const d = parsed.data

  await prisma.supportInquiry.create({
    data: {
      userId: session.user.id,
      category: d.category,
      body: d.body.trim(),
    },
  })

  revalidateUserInquiries()
  revalidateAdmin()
  return { success: true }
}

// ── 管理者：回覆提問（覆寫式，成功後通知學員）──
export async function replyInquiry(
  inquiryId: number,
  formData: Record<string, unknown>
): Promise<ActionResponse> {
  const g = await requireAdmin()
  if (!g.ok) return g.res

  const parsed = replyInquirySchema.safeParse(formData)
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors }
  }

  const inquiry = await prisma.supportInquiry.findUnique({
    where: { id: inquiryId },
    select: { id: true, userId: true },
  })
  if (!inquiry) return { success: false, message: '找不到提問' }

  await prisma.supportInquiry.update({
    where: { id: inquiryId },
    data: {
      replyBody: parsed.data.replyBody.trim(),
      repliedById: g.adminId,
      repliedAt: new Date(),
      status: 'replied',
    },
  })

  await createNotification(
    inquiry.userId,
    '您的提問已獲得回覆',
    '管理者已回覆您的提問，請至「我的提問」查看詳情。'
  )

  revalidateAdmin()
  revalidateUserInquiries()
  return { success: true, message: '已送出回覆' }
}

// ── 管理者：重新標記為待處理（不清空既有回覆內容）──
export async function reopenInquiry(inquiryId: number): Promise<ActionResponse> {
  const g = await requireAdmin()
  if (!g.ok) return g.res

  const inquiry = await prisma.supportInquiry.findUnique({
    where: { id: inquiryId },
    select: { id: true },
  })
  if (!inquiry) return { success: false, message: '找不到提問' }

  await prisma.supportInquiry.update({
    where: { id: inquiryId },
    data: { status: 'pending' },
  })

  revalidateAdmin()
  revalidateUserInquiries()
  return { success: true, message: '已重新標記為待處理' }
}
