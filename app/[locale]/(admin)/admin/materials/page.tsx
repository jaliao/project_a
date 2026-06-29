/*
 * ----------------------------------------------
 * Admin 教材申請管理頁面
 * 2026-03-30
 * app/(user)/admin/materials/page.tsx
 * ----------------------------------------------
 */

export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import Link from 'next/link'
import { IconArrowLeft, IconPackage } from '@tabler/icons-react'
import { getAllCourseOrdersWithInvite } from '@/lib/data/course-order'
import { getAdminSetting, REMITTANCE_ACCOUNT_KEY, REMITTANCE_ACCOUNT_DEFAULT } from '@/lib/data/admin-settings'
import { MaterialOrderTable } from '@/components/admin/material-order-table'

export const metadata: Metadata = {
  title: '教材申請管理 — 啟動事工',
}

export default async function AdminMaterialsPage() {
  // 守衛（登入 + admin 身分）由 (admin)/layout.tsx 統一處理

  const [orders, remittanceAccount] = await Promise.all([
    getAllCourseOrdersWithInvite(),
    getAdminSetting(REMITTANCE_ACCOUNT_KEY, REMITTANCE_ACCOUNT_DEFAULT),
  ])

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

      <MaterialOrderTable orders={orders} defaultRemittanceAccount={remittanceAccount} />
    </div>
  )
}
