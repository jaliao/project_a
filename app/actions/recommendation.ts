/*
 * ----------------------------------------------
 * Server Actions - 推薦講師（暫不接受決策）
 * 2026-07-01
 * app/actions/recommendation.ts
 * ----------------------------------------------
 */

'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { canAccessAdmin } from '@/lib/auth-roles'

type ActionResponse = { success: boolean; message?: string }

async function requireAdmin() {
  const session = await auth()
  if (!session?.user?.id) return { ok: false as const, res: { success: false, message: '請先登入' } }
  if (!canAccessAdmin(session.user.roles)) return { ok: false as const, res: { success: false, message: '無權限' } }
  return { ok: true as const, adminId: session.user.id }
}

// 標記暫不接受（記錄備註、時間、管理者）
export async function deferRecommendation(enrollmentId: number, note: string): Promise<ActionResponse> {
  const g = await requireAdmin()
  if (!g.ok) return g.res
  const value = note.trim() ? note.trim().slice(0, 500) : null
  await prisma.inviteEnrollment.update({
    where: { id: enrollmentId },
    data: { recommendDeferredAt: new Date(), recommendDeferredById: g.adminId, recommendDeferralNote: value },
  })
  revalidatePath('/admin/recommendations')
  revalidatePath('/admin')
  return { success: true, message: '已標記暫不接受' }
}

// 取消暫不接受（回到未處理）
export async function undeferRecommendation(enrollmentId: number): Promise<ActionResponse> {
  const g = await requireAdmin()
  if (!g.ok) return g.res
  await prisma.inviteEnrollment.update({
    where: { id: enrollmentId },
    data: { recommendDeferredAt: null, recommendDeferredById: null, recommendDeferralNote: null },
  })
  revalidatePath('/admin/recommendations')
  revalidatePath('/admin')
  return { success: true, message: '已取消暫不接受' }
}
