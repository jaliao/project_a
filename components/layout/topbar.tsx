/*
 * ----------------------------------------------
 * Topbar - 頂部工具列
 * 2026-03-23 (Updated: 2026-08-29)
 * components/layout/topbar.tsx
 * ----------------------------------------------
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { IconUser, IconBell, IconHome, IconLayoutDashboard, IconClipboardList, IconMessageCircle, IconMessage, IconMenu2, IconNotebook } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { useTranslations } from 'next-intl'
import { NotificationDrawer } from '@/components/notification/notification-drawer'
import { canAccessAdmin } from '@/lib/auth-roles'
import { UserAvatar } from '@/components/shared/user-avatar'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'

interface TopbarProps {
  unreadCount?: number
  unreadMessageCount?: number
  roles?: string[]
  spiritId?: string
  avatarUrl?: string | null
}

export function Topbar({ unreadCount = 0, unreadMessageCount = 0, roles, spiritId, avatarUrl }: TopbarProps) {
  const t = useTranslations('nav')
  const tc = useTranslations('common')
  const router = useRouter()
  const [isNotifOpen, setIsNotifOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  const isAdmin = canAccessAdmin(roles)
  const homeUrl = spiritId ? `/user/${spiritId.toLowerCase()}` : '/'
  const profileUrl = spiritId ? `/user/${spiritId.toLowerCase()}/profile` : '/profile'
  const inquiriesUrl = spiritId ? `/user/${spiritId.toLowerCase()}/inquiries` : '/login'
  const learningUrl = spiritId ? `/user/${spiritId.toLowerCase()}/learning` : '/login'

  // 導頁後關閉手機選單
  const go = (href: string) => {
    setMenuOpen(false)
    router.push(href)
  }

  // 手機選單項目：與桌機按鈕群相同集合（含未讀數、admin 顯示條件）
  const menuItems: {
    key: string
    icon: typeof IconHome
    label: string
    badge?: number
    onClick: () => void
  }[] = [
    { key: 'home', icon: IconHome, label: t('home'), onClick: () => go(homeUrl) },
    { key: 'matchBoard', icon: IconClipboardList, label: t('matchBoard'), onClick: () => go('/match-board') },
    { key: 'learning', icon: IconNotebook, label: t('learning'), onClick: () => go(learningUrl) },
    ...(isAdmin
      ? [{ key: 'admin', icon: IconLayoutDashboard, label: t('admin'), onClick: () => go('/admin') }]
      : []),
    { key: 'profile', icon: IconUser, label: t('profile'), onClick: () => go(profileUrl) },
    { key: 'help', icon: IconMessageCircle, label: t('help'), onClick: () => go(inquiriesUrl) },
    { key: 'messages', icon: IconMessage, label: t('messages'), badge: unreadMessageCount, onClick: () => go('/messages') },
    {
      key: 'notifications',
      icon: IconBell,
      label: t('notifications'),
      badge: unreadCount,
      onClick: () => {
        setMenuOpen(false)
        setIsNotifOpen(true)
      },
    },
  ]

  return (
    <header className="sticky top-0 z-50 bg-background flex h-16 items-center border-b px-4 gap-4">
      {/* 品牌 / Logo（可點回首頁；窄螢幕以 truncate 收斂，不擠壓右側） */}
      <button
        type="button"
        onClick={() => router.push(homeUrl)}
        aria-label={t('home')}
        className="flex min-w-0 flex-1 items-center gap-2"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
          className="h-5 w-5 shrink-0"
        >
          <path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3" />
        </svg>
        <span className="truncate text-lg font-semibold">{tc('appName')}</span>
      </button>

      {/* 右側操作按鈕群組（桌機平鋪；手機收合至下方選單） */}
      <div className="hidden md:flex items-center gap-2">
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

        {/* 我的學習（所有登入會員；分段查經筆記入口） */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push(learningUrl)}
          title={t('learning')}
        >
          <IconNotebook className="h-5 w-5" />
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
          {avatarUrl ? (
            <UserAvatar avatarUrl={avatarUrl} displayName="" size="sm" />
          ) : (
            <IconUser className="h-5 w-5" />
          )}
        </Button>

        {/* 聯絡管理者（所有登入會員） */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push(inquiriesUrl)}
          title={t('help')}
        >
          <IconMessageCircle className="h-5 w-5" />
        </Button>

        {/* 訊息（所有登入會員） */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push('/messages')}
          title={t('messages')}
          className="relative"
        >
          <IconMessage className="h-5 w-5" />
          {unreadMessageCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white leading-none">
              {unreadMessageCount > 99 ? '99+' : unreadMessageCount}
            </span>
          )}
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
      </div>

      {/* 手機選單（<md）：右側動作收合為單一「選單」按鈕 */}
      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label={t('menu')}
            title={t('menu')}
          >
            <IconMenu2 className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-72">
          <SheetHeader>
            <SheetTitle>{t('menu')}</SheetTitle>
          </SheetHeader>
          <nav className="flex flex-col px-2">
            {menuItems.map(({ key, icon: Icon, label, badge, onClick }) => (
              <button
                key={key}
                type="button"
                onClick={onClick}
                className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm hover:bg-accent"
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span className="flex-1 text-left">{label}</span>
                {badge !== undefined && badge > 0 && (
                  <span className="ml-auto flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white leading-none">
                    {badge > 99 ? '99+' : badge}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </SheetContent>
      </Sheet>

      {/* 通知 Drawer（桌機按鈕與手機選單共用） */}
      <NotificationDrawer
        open={isNotifOpen}
        onOpenChange={setIsNotifOpen}
        initialUnreadCount={unreadCount}
      />
    </header>
  )
}
