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
import { IconUser, IconBell, IconHome, IconLayoutDashboard } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { NotificationDrawer } from '@/components/notification/notification-drawer'

interface TopbarProps {
  unreadCount?: number
  role?: string
  spiritId?: string
}

export function Topbar({ unreadCount = 0, role, spiritId }: TopbarProps) {
  const router = useRouter()
  const [isNotifOpen, setIsNotifOpen] = useState(false)

  const isAdmin = role === 'admin' || role === 'superadmin'
  const homeUrl = spiritId ? `/user/${spiritId.toLowerCase()}` : '/'
  const profileUrl = spiritId ? `/user/${spiritId.toLowerCase()}/profile` : '/profile'

  return (
    <header className="sticky top-0 z-50 bg-background flex h-16 items-center border-b px-4 gap-4">
      {/* 系統標題 */}
      <span className="font-semibold text-lg flex-1">啟動事工</span>

      {/* 右側操作按鈕群組 */}
      <div className="flex items-center gap-2">
        {/* 回首頁 */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push(homeUrl)}
          title="回首頁"
        >
          <IconHome className="h-5 w-5" />
        </Button>

        {/* 後台管理（admin/superadmin only） */}
        {isAdmin && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/admin')}
            title="後台管理"
          >
            <IconLayoutDashboard className="h-5 w-5" />
          </Button>
        )}

        {/* 個人資料 */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push(profileUrl)}
          title="個人資料"
        >
          <IconUser className="h-5 w-5" />
        </Button>

        {/* 訊息通知 */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsNotifOpen(true)}
          title="訊息通知"
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
      </div>
    </header>
  )
}
