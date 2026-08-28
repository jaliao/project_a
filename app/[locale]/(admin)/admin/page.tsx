/*
 * ----------------------------------------------
 * 管理後台首頁
 * 2026-03-24 (Updated: 2026-07-13)
 * app/(user)/admin/page.tsx
 * ----------------------------------------------
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { isSuperadmin } from '@/lib/auth-roles'
import { getPendingRecommendationCount } from '@/lib/data/recommendation'
import { getMaterialTodoCount } from '@/lib/data/course-order'
import { getPendingInquiryCount } from '@/lib/data/support-inquiry'
import {
  IconLayoutDashboard,
  IconSchool,
  IconPackage,
  IconCertificate,
  IconUserStar,
  IconUsers,
  IconUserExclamation,
  IconSettings,
  IconMessageCircle,
  IconHistory,
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
    href: '/admin/dashboard',
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
    title: '證書製作',
    description: '管理實體結業證書製作',
    icon: IconCertificate,
    href: '/admin/certificates',
    superadminOnly: false,
  },
  {
    title: '推薦講師',
    description: '檢視老師推薦並處理',
    icon: IconUserStar,
    href: '/admin/recommendations',
    superadminOnly: false,
  },
  {
    title: '提問管理',
    description: '查看並回覆學員提問',
    icon: IconMessageCircle,
    href: '/admin/support-inquiries',
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
    title: '未啟用會員',
    description: '查詢從未登入過的會員',
    icon: IconUserExclamation,
    href: '/admin/members/inactive',
    superadminOnly: false,
  },
  {
    title: '系統設定',
    description: '調整系統全域參數',
    icon: IconSettings,
    href: '/admin/settings',
    superadminOnly: false,
  },
  {
    title: '系統活動紀錄',
    description: '檢視後台管理操作紀錄',
    icon: IconHistory,
    href: '/admin/activity-logs',
    superadminOnly: false,
  },
]

export default async function AdminPage() {
  const session = await auth()
  const superadmin = isSuperadmin(session?.user?.roles)
  const [pendingRecommend, materialTodo, pendingInquiry] = await Promise.all([
    getPendingRecommendationCount(),
    getMaterialTodoCount(),
    getPendingInquiryCount(),
  ])
  // 功能卡動態副標題（待辦 > 0 顯示提示，否則預設）
  const features = ADMIN_FEATURES.filter((f) => !f.superadminOnly || superadmin).map((f) => {
    if (f.href === '/admin/recommendations' && pendingRecommend > 0) {
      return { ...f, description: `有 ${pendingRecommend} 筆待處理推薦` }
    }
    if (f.href === '/admin/materials' && materialTodo > 0) {
      return { ...f, description: `${materialTodo} 筆待批價/確認款項/出貨` }
    }
    if (f.href === '/admin/support-inquiries' && pendingInquiry > 0) {
      return { ...f, description: `有 ${pendingInquiry} 筆待處理提問` }
    }
    return f
  })

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
