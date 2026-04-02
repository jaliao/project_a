/*
 * ----------------------------------------------
 * 後台教會/單位管理頁
 * 2026-04-02
 * app/(user)/admin/churches/page.tsx
 * ----------------------------------------------
 */

import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { getAllChurches, getChurchMemberCount } from '@/lib/data/churches'
import { ChurchList } from '@/components/admin/church-list'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: '教會管理 — 啟動事工',
}

export default async function AdminChurchesPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const isAdmin =
    session.user.role === 'admin' || session.user.role === 'superadmin'
  if (!isAdmin) redirect('/')

  const churches = await getAllChurches()
  const churchesWithCount = await Promise.all(
    churches.map(async (c) => ({
      ...c,
      memberCount: await getChurchMemberCount(c.id),
    }))
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">教會/單位管理</h1>
        <span className="text-sm text-muted-foreground">{churches.length} 個教會</span>
      </div>

      <ChurchList churches={churchesWithCount} />
    </div>
  )
}
