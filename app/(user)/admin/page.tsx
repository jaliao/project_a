/*
 * ----------------------------------------------
 * 管理後台首頁
 * 2026-03-24 (Updated: 2026-04-01)
 * app/(user)/admin/page.tsx
 * ----------------------------------------------
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import {
  IconLayoutDashboard,
  IconBook,
  IconSchool,
  IconPackage,
  IconUsers,
} from '@tabler/icons-react'

export const metadata: Metadata = {
  title: '管理後台 — 啟動靈人系統',
}

const ADMIN_FEATURES = [
  {
    title: '儀錶板',
    description: '系統統計與概覽',
    icon: IconLayoutDashboard,
    href: null, // 待開發
    badge: '待開發',
  },
  {
    title: '課程管理',
    description: '管理課程目錄與內容',
    icon: IconBook,
    href: '/admin/course-catalog',
  },
  {
    title: '授課管理',
    description: '管理開課場次與學員',
    icon: IconSchool,
    href: '/course-sessions',
  },
  {
    title: '教材作業',
    description: '管理教材申請與出貨',
    icon: IconPackage,
    href: '/admin/materials',
  },
  {
    title: '會員管理',
    description: '查看會員資料與重設密碼',
    icon: IconUsers,
    href: '/admin/members',
  },
]

export default function AdminPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">管理後台</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ADMIN_FEATURES.map((feature) => {
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
