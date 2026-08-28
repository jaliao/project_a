/*
 * ----------------------------------------------
 * 後台系統活動紀錄清單頁
 * 2026-08-28
 * app/[locale]/(admin)/admin/activity-logs/page.tsx
 * ----------------------------------------------
 */

export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import Link from 'next/link'
import { IconClipboardList, IconInfoCircle } from '@tabler/icons-react'
import { getAdminActivityLogs } from '@/lib/data/admin-logs'
import { getAdminLogActionLabel } from '@/config/admin-log-action'
import { Badge } from '@/components/ui/badge'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from '@/components/ui/pagination'
import { ActivityLogsFilter } from './activity-logs-filter'

export const metadata: Metadata = {
  title: '系統活動紀錄 — 啟動事工',
}

// 頁碼視窗：總頁數 <=7 全列出；否則頭尾＋目前頁前後各 1 頁，其餘以單一 'ellipsis' 收合
function getPaginationRange(current: number, total: number): (number | 'ellipsis')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages = [...new Set([1, total, current - 1, current, current + 1])].filter(
    (p) => p >= 1 && p <= total
  )
  pages.sort((a, b) => a - b)
  const result: (number | 'ellipsis')[] = []
  let prev = 0
  for (const p of pages) {
    if (prev && p - prev > 1) result.push('ellipsis')
    result.push(p)
    prev = p
  }
  return result
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

export default async function AdminActivityLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ action?: string; q?: string; from?: string; to?: string; page?: string }>
}) {
  // 守衛（登入 + admin）由 (admin)/layout.tsx 統一處理
  const sp = await searchParams
  const action = sp.action ?? ''
  const q = sp.q ?? ''
  const from = sp.from ?? ''
  const to = sp.to ?? ''
  const page = Math.max(1, Number(sp.page) || 1)

  const hasFilter = !!(action || q || from || to)

  const result = await getAdminActivityLogs({
    page,
    action: action || undefined,
    keyword: q || undefined,
    dateFrom: from || undefined,
    dateTo: to || undefined,
  })

  // 分頁連結：保留目前篩選條件
  const qs = (p: number) => {
    const params = new URLSearchParams()
    if (action) params.set('action', action)
    if (q) params.set('q', q)
    if (from) params.set('from', from)
    if (to) params.set('to', to)
    params.set('page', String(p))
    return `/admin/activity-logs?${params.toString()}`
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <IconClipboardList className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-semibold">系統活動紀錄</h1>
        </div>
        <Link
          href="/admin/activity-logs/rules"
          className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm hover:bg-muted/60"
        >
          <IconInfoCircle className="h-4 w-4" />
          說明
        </Link>
      </div>

      <p className="text-sm text-muted-foreground">
        記錄後台管理操作（新增／移除學員、教材申請完成與重新開放、刪除會員），最新在前、每頁 30 筆。
        欲了解哪些操作會被記錄，請點右上角「說明」。
      </p>

      <ActivityLogsFilter defaultAction={action} defaultQ={q} defaultFrom={from} defaultTo={to} />

      {hasFilter && (
        <div>
          <Link href="/admin/activity-logs" className="text-sm text-primary hover:underline">
            清除篩選
          </Link>
        </div>
      )}

      {result.items.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {hasFilter ? '查無符合條件的紀錄' : '尚無任何活動紀錄'}
        </p>
      ) : (
        <>
          <div className="space-y-3">
            {result.items.map((log) => (
              <div key={log.id} className="space-y-1.5 rounded-lg border p-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={
                        log.action === 'enrollment_remove' || log.action === 'member_delete'
                          ? 'border-red-200 text-red-700'
                          : log.action === 'enrollment_add'
                            ? 'border-green-200 text-green-700'
                            : 'border-blue-200 text-blue-700'
                      }
                    >
                      {getAdminLogActionLabel(log.action)}
                    </Badge>
                    <span className="text-muted-foreground">{fmtDateTime(log.createdAt)}</span>
                  </div>
                  <span className="text-muted-foreground">操作者：{log.actorName}</span>
                </div>
                <p className="break-words">
                  <span className="text-muted-foreground">對象：</span>
                  {log.targetName}
                </p>
                {log.inviteTitle && (
                  <p className="break-words">
                    <span className="text-muted-foreground">班級：</span>
                    {log.inviteTitle}
                  </p>
                )}
                {log.detail && <p className="break-words text-muted-foreground">{log.detail}</p>}
              </div>
            ))}
          </div>

          {result.totalPages > 1 && (
            <div className="flex flex-col items-center gap-2 sm:flex-row sm:justify-between">
              <span className="text-sm text-muted-foreground">
                第 {result.page} / {result.totalPages} 頁・共 {result.total} 筆
              </span>
              <Pagination className="mx-0 w-auto">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href={qs(Math.max(1, result.page - 1))}
                      aria-disabled={result.page <= 1}
                      className={result.page <= 1 ? 'pointer-events-none opacity-50' : undefined}
                    />
                  </PaginationItem>
                  {getPaginationRange(result.page, result.totalPages).map((p, i) =>
                    p === 'ellipsis' ? (
                      <PaginationItem key={`ellipsis-${i}`}>
                        <PaginationEllipsis />
                      </PaginationItem>
                    ) : (
                      <PaginationItem key={p}>
                        <PaginationLink href={qs(p)} isActive={p === result.page}>
                          {p}
                        </PaginationLink>
                      </PaginationItem>
                    )
                  )}
                  <PaginationItem>
                    <PaginationNext
                      href={qs(Math.min(result.totalPages, result.page + 1))}
                      aria-disabled={result.page >= result.totalPages}
                      className={
                        result.page >= result.totalPages ? 'pointer-events-none opacity-50' : undefined
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </>
      )}
    </div>
  )
}
