/*
 * ----------------------------------------------
 * 管理後台首頁
 * 2026-03-24 (Updated: 2026-04-01)
 * app/(user)/admin/page.tsx
 * ----------------------------------------------
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import {
  IconLayoutDashboard,
  IconSchool,
  IconPackage,
  IconUsers,
  IconSettings,
} from '@tabler/icons-react'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: '管理後台 — 啟動事工',
}

const ADMIN_FEATURES = [
  {
    title: '儀錶板',
    description: '系統統計與概覽',
    icon: IconLayoutDashboard,
    href: null, // 待開發
    badge: '待開發',
    superadminOnly: false,
  },
  {
    title: '授課管理',
    description: '管理開課場次與學員',
    icon: IconSchool,
    href: '/admin/course-sessions',
    superadminOnly: false,
  },
  {
    title: '教材作業',
    description: '管理教材申請與出貨',
    icon: IconPackage,
    href: '/admin/materials',
    superadminOnly: false,
  },
  {
    title: '會員管理',
    description: '查看會員資料與重設密碼',
    icon: IconUsers,
    href: '/admin/members',
    superadminOnly: false,
  },
  {
    title: '系統設定',
    description: '調整系統全域參數',
    icon: IconSettings,
    href: '/admin/settings',
    superadminOnly: true,
  },
]

export default async function AdminPage() {
  const session = await auth()
  const isSuperadmin = session?.user?.role === 'superadmin'
  const features = ADMIN_FEATURES.filter((f) => !f.superadminOnly || isSuperadmin)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">管理後台</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((feature) => {
          const Icon = feature.icon
          const isDisabled = !feature.href

          const cardClass =
            'rounded-lg border p-5 space-y-3 transition-colors ' +
            (isDisabled
              ? 'opacity-50 cursor-not-allowed bg-muted/30'
              : 'hover:bg-muted/40 cursor-pointer')

          const inner = (
            <>
              <div className="flex items-center justify-between">
                <Icon className="h-6 w-6 text-primary" />
                {feature.badge && (
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    {feature.badge}
                  </span>
                )}
              </div>
              <div>
                <p className="font-medium">{feature.title}</p>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            </>
          )

          if (isDisabled) {
            return (
              <div key={feature.title} className={cardClass}>
                {inner}
              </div>
            )
          }

          return (
            <Link key={feature.title} href={feature.href!} className={cardClass}>
              {inner}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
