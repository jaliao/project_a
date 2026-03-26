/*
 * ----------------------------------------------
 * Topbar - 頂部工具列
 * 2026-03-23 (Updated: 2026-03-26)
 * components/layout/topbar.tsx
 * ----------------------------------------------
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { IconUser, IconBell } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { NotificationDrawer } from '@/components/notification/notification-drawer'

interface TopbarProps {
  unreadCount?: number
}

export function Topbar({ unreadCount = 0 }: TopbarProps) {
  const router = useRouter()
  const [isNotifOpen, setIsNotifOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 bg-background flex h-16 items-center border-b px-4 gap-4">
      {/* 系統標題 */}
      <span className="font-semibold text-lg flex-1">啟動靈人系統</span>

      {/* 右側操作按鈕群組 */}
      <div className="flex items-center gap-2">
        {/* 個人資料 */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push('/profile')}
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
