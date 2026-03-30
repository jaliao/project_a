/*
 * ----------------------------------------------
 * Admin 教材申請管理頁面
 * 2026-03-30
 * app/(user)/admin/materials/page.tsx
 * ----------------------------------------------
 */

export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { IconArrowLeft, IconPackage } from '@tabler/icons-react'
import { auth } from '@/lib/auth'
import { getAllCourseOrdersWithInvite } from '@/lib/data/course-order'
import { MaterialOrderTable } from '@/components/admin/material-order-table'

export const metadata: Metadata = {
  title: '教材申請管理 — 啟動靈人系統',
}

export default async function AdminMaterialsPage() {
  const session = await auth()

  // 僅 admin/superadmin 可存取
  const isAdmin =
    session?.user?.role === 'admin' || session?.user?.role === 'superadmin'
  if (!isAdmin) redirect('/dashboard')

  const orders = await getAllCourseOrdersWithInvite()

  return (
    <div className="space-y-6">
      <Link
        href="/admin"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <IconArrowLeft className="h-4 w-4" />
        返回管理後台
      </Link>

      <div className="flex items-center gap-3">
        <IconPackage className="h-6 w-6 text-primary shrink-0" />
        <div>
          <h1 className="text-2xl font-semibold">教材申請管理</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            共 {orders.length} 筆申請
          </p>
        </div>
      </div>

      <MaterialOrderTable orders={orders} />
    </div>
  )
}
