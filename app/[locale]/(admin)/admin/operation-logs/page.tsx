/*
 * ----------------------------------------------
 * 後台管理操作紀錄頁
 * 2026-07-14
 * app/[locale]/(admin)/admin/operation-logs/page.tsx
 *
 * 最新在前、每頁 30 筆；支援 ?inviteId= 過濾單一班級。
 * 一律以快照欄呈現（對象被刪除後仍完整可讀）。
 * ----------------------------------------------
 */

export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import Link from 'next/link'
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react'
import { getAdminLogs } from '@/lib/data/admin-logs'
import { getAdminLogActionLabel } from '@/config/admin-log-action'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: '操作紀錄 — 啟動事工',
}

function fmtDateTime(d: Date): string {
  return new Date(d).toLocaleString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default async function AdminOperationLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; inviteId?: string }>
}) {
  // 守衛（登入 + admin 身分）由 (admin)/layout.tsx 統一處理
  const sp = await searchParams
  const page = Math.max(1, Number(sp.page) || 1)
  const inviteId = Number(sp.inviteId) > 0 ? Number(sp.inviteId) : undefined

  const result = await getAdminLogs({ page, inviteId })

  const qs = (p: number) => {
    const params = new URLSearchParams()
    if (inviteId) params.set('inviteId', String(inviteId))
    params.set('page', String(p))
    return `?${params.toString()}`
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">操作紀錄</h1>
        <span className="text-sm text-muted-foreground">共 {result.total} 筆</span>
      </div>

      {inviteId && (
        <div className="flex items-center gap-2 text-sm">
          <Badge variant="outline">班級 #{inviteId}</Badge>
          <Link href="/admin/operation-logs" className="text-muted-foreground underline">
            清除過濾
          </Link>
        </div>
      )}

      {result.items.length === 0 ? (
        <div className="rounded-lg border p-10 text-center text-sm text-muted-foreground">
          尚無操作紀錄
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {result.items.map((log) => (
              <div key={log.id} className="space-y-1.5 rounded-lg border p-4 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={
                        log.action === 'enrollment_remove'
                          ? 'border-red-200 text-red-700'
                          : 'border-green-200 text-green-700'
                      }
                    >
                      {getAdminLogActionLabel(log.action)}
                    </Badge>
                    <span className="text-muted-foreground">{fmtDateTime(log.createdAt)}</span>
                  </div>
                  <span className="text-muted-foreground">操作者：{log.actorName}</span>
                </div>
                <p className="break-words">
                  <span className="text-muted-foreground">班級：</span>
                  {log.inviteTitle}
                </p>
                <p className="break-words">
                  <span className="text-muted-foreground">對象：</span>
                  {log.targetName}
                </p>
                {log.detail && (
                  <p className="break-words text-muted-foreground">{log.detail}</p>
                )}
              </div>
            ))}
          </div>

          {result.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                第 {result.page} / {result.totalPages} 頁・共 {result.total} 筆
              </span>
              <div className="flex gap-2">
                {result.page > 1 ? (
                  <Button variant="outline" size="sm" asChild>
                    <Link href={qs(result.page - 1)}>
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
                {result.page < result.totalPages ? (
                  <Button variant="outline" size="sm" asChild>
                    <Link href={qs(result.page + 1)}>
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
