/*
 * ----------------------------------------------
 * 通知歷史頁面
 * 2026-03-24
 * app/(user)/notifications/page.tsx
 * ----------------------------------------------
 */

import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { getNotificationsPaginated } from '@/lib/data/notification'
import { markNotificationRead } from '@/app/actions/notification'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react'
import type { Notification } from '@prisma/client'

const PAGE_SIZE = 20

interface PageProps {
  searchParams: Promise<{ page?: string }>
}

/** 絕對時間格式化 */
function formatAbsoluteTime(date: Date): string {
  return new Date(date).toLocaleString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default async function NotificationsPage({ searchParams }: PageProps) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const params = await searchParams
  const page = Math.max(1, parseInt(params.page ?? '1', 10))

  const { items, total, totalPages } = await getNotificationsPaginated(
    session.user.id,
    page,
    PAGE_SIZE
  )

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-xl font-semibold mb-6">通知紀錄</h1>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <p className="text-sm">目前沒有通知紀錄</p>
        </div>
      ) : (
        <>
          <ul className="divide-y border rounded-lg overflow-hidden">
            {items.map((n: Notification) => (
              <li
                key={n.id}
                className={cn(
                  'px-4 py-3',
                  !n.isRead && 'bg-blue-50/60 dark:bg-blue-950/20'
                )}
              >
                <div className="flex items-start gap-3">
                  {!n.isRead && (
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
                  )}
                  <div className={cn('flex-1 min-w-0', n.isRead && 'pl-5')}>
                    <p className={cn('text-sm font-medium', n.isRead && 'text-muted-foreground')}>
                      {n.title}
                    </p>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {n.body}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatAbsoluteTime(n.createdAt)}
                      {n.isRead && n.readAt && (
                        <span className="ml-2">· 已讀</span>
                      )}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          {/* 分頁控制 */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <span className="text-sm text-muted-foreground">
                共 {total} 則，第 {page} / {totalPages} 頁
              </span>
              <div className="flex gap-2">
                {page > 1 ? (
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/notifications?page=${page - 1}`}>
                      <IconChevronLeft className="h-4 w-4" />
                      上一頁
                    </Link>
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" disabled>
                    <IconChevronLeft className="h-4 w-4" />
                    上一頁
                  </Button>
                )}
                {page < totalPages ? (
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/notifications?page=${page + 1}`}>
                      下一頁
                      <IconChevronRight className="h-4 w-4" />
                    </Link>
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" disabled>
                    下一頁
                    <IconChevronRight className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
