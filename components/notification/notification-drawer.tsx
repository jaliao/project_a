/*
 * ----------------------------------------------
 * NotificationDrawer - 右側通知 Drawer
 * 2026-03-24
 * components/notification/notification-drawer.tsx
 * ----------------------------------------------
 */

'use client'

import { useEffect, useState, useTransition } from 'react'
import Link from 'next/link'
import type { Notification } from '@prisma/client'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { fetchNotifications, markNotificationRead, markAllNotificationsRead } from '@/app/actions/notification'
import { cn } from '@/lib/utils'

interface NotificationDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialUnreadCount: number
}

/** 相對時間格式化 */
function formatRelativeTime(date: Date): string {
  const diff = Date.now() - new Date(date).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return '剛剛'
  if (minutes < 60) return `${minutes} 分鐘前`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} 小時前`
  const days = Math.floor(hours / 24)
  return `${days} 天前`
}

export function NotificationDrawer({ open, onOpenChange, initialUnreadCount }: NotificationDrawerProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount)
  const [loaded, setLoaded] = useState(false)
  const [isPending, startTransition] = useTransition()

  // 開啟時 lazy load 通知
  useEffect(() => {
    if (open && !loaded) {
      startTransition(async () => {
        const data = await fetchNotifications(20)
        setNotifications(data)
        setLoaded(true)
      })
    }
  }, [open, loaded])

  // 同步外部 unreadCount 變化
  useEffect(() => {
    setUnreadCount(initialUnreadCount)
  }, [initialUnreadCount])

  function handleMarkRead(id: number) {
    startTransition(async () => {
      await markNotificationRead(id)
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, isRead: true, readAt: new Date() } : n)
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    })
  }

  function handleMarkAllRead() {
    startTransition(async () => {
      await markAllNotificationsRead()
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true, readAt: n.readAt ?? new Date() })))
      setUnreadCount(0)
    })
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:w-96 p-0 flex flex-col">
        <SheetHeader className="px-4 py-3 border-b flex-row items-center justify-between space-y-0">
          <SheetTitle className="text-base">通知</SheetTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleMarkAllRead}
            disabled={unreadCount === 0 || isPending}
            className="text-xs text-muted-foreground"
          >
            全部標為已讀
          </Button>
        </SheetHeader>

        <ScrollArea className="flex-1">
          {!loaded && isPending ? (
            <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
              載入中…
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
              目前沒有通知
            </div>
          ) : (
            <ul className="divide-y">
              {notifications.map(n => (
                <li
                  key={n.id}
                  onClick={() => !n.isRead && handleMarkRead(n.id)}
                  className={cn(
                    'px-4 py-3 cursor-pointer hover:bg-accent transition-colors',
                    !n.isRead && 'bg-blue-50/60 dark:bg-blue-950/20'
                  )}
                >
                  <div className="flex items-start gap-2">
                    {/* 未讀色條 */}
                    {!n.isRead && (
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
                    )}
                    <div className={cn('flex-1 min-w-0', n.isRead && 'pl-4')}>
                      <p className={cn('text-sm font-medium truncate', n.isRead && 'text-muted-foreground')}>
                        {n.title}
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                        {n.body}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatRelativeTime(n.createdAt)}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>

        {/* 查看全部連結 */}
        <div className="border-t px-4 py-3">
          <Link
            href="/notifications"
            onClick={() => onOpenChange(false)}
            className="text-sm text-primary hover:underline"
          >
            查看全部通知
          </Link>
        </div>
      </SheetContent>
    </Sheet>
  )
}
