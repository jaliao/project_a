/*
 * ----------------------------------------------
 * Server Actions - 實體結業證書製作
 * 2026-07-01
 * app/actions/certificate.ts
 * ----------------------------------------------
 */

'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { canAccessAdmin } from '@/lib/auth-roles'

type ActionResponse = { success: boolean; message?: string }
type CertKey = { userId: string; courseCatalogId: number }

async function requireAdmin() {
  const session = await auth()
  if (!session?.user?.id) return { ok: false as const, res: { success: false, message: '請先登入' } }
  if (!canAccessAdmin(session.user.roles)) return { ok: false as const, res: { success: false, message: '無權限' } }
  return { ok: true as const, adminId: session.user.id }
}

const whereKey = (key: CertKey) => ({
  userId_courseCatalogId: { userId: key.userId, courseCatalogId: key.courseCatalogId },
})

// 標記已完成製作（記錄製作日期與製作管理者）
export async function markCertificateProduced(key: CertKey): Promise<ActionResponse> {
  const g = await requireAdmin()
  if (!g.ok) return g.res
  await prisma.certificateProduction.upsert({
    where: whereKey(key),
    create: { ...key, producedAt: new Date(), producedById: g.adminId },
    update: { producedAt: new Date(), producedById: g.adminId },
  })
  revalidatePath('/admin/certificates')
  return { success: true, message: '已標記為已完成製作' }
}

// 還原為未完成（清除製作日期與管理者；保留備註）
export async function unmarkCertificateProduced(key: CertKey): Promise<ActionResponse> {
  const g = await requireAdmin()
  if (!g.ok) return g.res
  await prisma.certificateProduction.upsert({
    where: whereKey(key),
    create: { ...key },
    update: { producedAt: null, producedById: null },
  })
  revalidatePath('/admin/certificates')
  return { success: true, message: '已還原為未完成' }
}

// 更新備註（trim 後空存 null，上限 500 字）
export async function updateCertificateNote(key: CertKey, note: string): Promise<ActionResponse> {
  const g = await requireAdmin()
  if (!g.ok) return g.res
  const value = note.trim() ? note.trim().slice(0, 500) : null
  await prisma.certificateProduction.upsert({
    where: whereKey(key),
    create: { ...key, note: value },
    update: { note: value },
  })
  revalidatePath('/admin/certificates')
  return { success: true, message: '已儲存備註' }
}
