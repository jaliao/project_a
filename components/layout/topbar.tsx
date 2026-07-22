/*
 * ----------------------------------------------
 * Topbar - 頂部工具列
 * 2026-03-23 (Updated: 2026-04-02)
 * components/layout/topbar.tsx
 * ----------------------------------------------
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { IconUser, IconBell, IconHome, IconLayoutDashboard, IconClipboardList, IconHelpCircle } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { useTranslations } from 'next-intl'
import { NotificationDrawer } from '@/components/notification/notification-drawer'
import { ContactAdminDialog } from '@/components/support-inquiry/contact-admin-dialog'
import { canAccessAdmin } from '@/lib/auth-roles'

interface TopbarProps {
  unreadCount?: number
  roles?: string[]
  spiritId?: string
}

export function Topbar({ unreadCount = 0, roles, spiritId }: TopbarProps) {
  const t = useTranslations('nav')
  const tc = useTranslations('common')
  const router = useRouter()
  const [isNotifOpen, setIsNotifOpen] = useState(false)
  const [isContactAdminOpen, setIsContactAdminOpen] = useState(false)

  const isAdmin = canAccessAdmin(roles)
  const homeUrl = spiritId ? `/user/${spiritId.toLowerCase()}` : '/'
  const profileUrl = spiritId ? `/user/${spiritId.toLowerCase()}/profile` : '/profile'

  return (
    <header className="sticky top-0 z-50 bg-background flex h-16 items-center border-b px-4 gap-4">
      {/* 系統標題 */}
      <span className="font-semibold text-lg flex-1">{tc('appName')}</span>

      {/* 右側操作按鈕群組 */}
      <div className="flex items-center gap-2">
        {/* 回首頁 */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push(homeUrl)}
          title={t('home')}
        >
          <IconHome className="h-5 w-5" />
        </Button>

        {/* 媒合布告欄（所有登入會員） */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push('/match-board')}
          title={t('matchBoard')}
        >
          <IconClipboardList className="h-5 w-5" />
        </Button>

        {/* 後台管理（admin/superadmin only） */}
        {isAdmin && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/admin')}
            title={t('admin')}
          >
            <IconLayoutDashboard className="h-5 w-5" />
          </Button>
        )}

        {/* 個人資料 */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push(profileUrl)}
          title={t('profile')}
        >
          <IconUser className="h-5 w-5" />
        </Button>

        {/* 訊息通知 */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsNotifOpen(true)}
          title={t('notifications')}
          className="relative"
        >
          <IconBell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white leading-none">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Button>

        <NotificationDrawer
          open={isNotifOpen}
          onOpenChange={setIsNotifOpen}
          initialUnreadCount={unreadCount}
        />

        {/* 我需要幫助（聯繫管理者，所有登入會員） */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsContactAdminOpen(true)}
          title={t('help')}
        >
          <IconHelpCircle className="h-5 w-5" />
        </Button>

        <ContactAdminDialog open={isContactAdminOpen} onOpenChange={setIsContactAdminOpen} />
      </div>
    </header>
  )
}
