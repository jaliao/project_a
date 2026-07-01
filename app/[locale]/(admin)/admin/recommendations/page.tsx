/*
 * ----------------------------------------------
 * 後台推薦講師管理頁
 * 2026-07-01
 * app/[locale]/(admin)/admin/recommendations/page.tsx
 * ----------------------------------------------
 */

export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import Link from 'next/link'
import { IconChevronLeft, IconChevronRight, IconExternalLink } from '@tabler/icons-react'
import { getRecommendationList, type RecommendationStatus } from '@/lib/data/recommendation'
import { RecommendationActions } from '@/components/admin/recommendation-actions'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export const metadata: Metadata = {
  title: '推薦講師 — 啟動事工',
}

const TABS: { value: RecommendationStatus | 'all'; label: string }[] = [
  { value: 'pending', label: '未處理' },
  { value: 'deferred', label: '暫不接受' },
  { value: 'accepted', label: '已成為講師' },
  { value: 'all', label: '全部' },
]

function fmtDate(d: Date | null): string {
  return d ? new Date(d).toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' }) : '—'
}

function StatusBadge({ status }: { status: RecommendationStatus }) {
  if (status === 'accepted') return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">已成為講師</Badge>
  if (status === 'deferred') return <Badge variant="secondary">暫不接受</Badge>
  return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">未處理</Badge>
}

export default async function AdminRecommendationsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>
}) {
  // 守衛（登入 + admin）由 (admin)/layout.tsx 統一處理
  const sp = await searchParams
  const status = (['pending', 'deferred', 'accepted', 'all'].includes(sp.status ?? '')
    ? sp.status
    : 'pending') as RecommendationStatus | 'all'
  const page = Math.max(1, Number(sp.page) || 1)

  const result = await getRecommendationList({ status, page })

  const qs = (p: number) => `?status=${status}&page=${p}`

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">推薦講師</h1>
        <span className="text-sm text-muted-foreground">共 {result.total} 筆</span>
      </div>

      {/* 狀態分頁 */}
      <div className="inline-flex flex-wrap gap-1 rounded-md border p-0.5">
        {TABS.map((t) => (
          <Link
            key={t.value}
            href={`?status=${t.value}`}
            className={cn(
              'rounded px-3 py-1.5 text-sm',
              status === t.value ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
            )}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {result.items.length === 0 ? (
        <div className="rounded-lg border p-10 text-center text-sm text-muted-foreground">目前沒有符合的推薦</div>
      ) : (
        <>
          <div className="rounded-lg border overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
                  <th className="px-4 py-3">被推薦人</th>
                  <th className="px-4 py-3">推薦書別</th>
                  <th className="px-4 py-3">推薦老師</th>
                  <th className="px-4 py-3">回饋備註</th>
                  <th className="px-4 py-3">回饋時間</th>
                  <th className="px-4 py-3">狀態</th>
                  <th className="px-4 py-3">操作</th>
                  <th className="px-4 py-3">會員</th>
                </tr>
              </thead>
              <tbody>
                {result.items.map((it) => (
                  <tr key={it.enrollmentId} className="border-b align-top">
                    <td className="px-4 py-3">
                      <div className="font-medium">{it.displayName}</div>
                      {it.spiritId && <div className="font-mono text-xs text-muted-foreground">{it.spiritId}</div>}
                    </td>
                    <td className="px-4 py-3">{it.bookLabel}</td>
                    <td className="px-4 py-3 text-muted-foreground">{it.teacherName}</td>
                    <td className="px-4 py-3 text-muted-foreground max-w-[16rem] whitespace-pre-wrap">{it.feedbackNote || '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{fmtDate(it.feedbackAt)}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={it.status} />
                      {it.status === 'deferred' && (
                        <div className="mt-1 text-xs text-muted-foreground">
                          {fmtDate(it.deferredAt)}
                          {it.deferredByName ? `・${it.deferredByName}` : ''}
                          {it.deferralNote ? `：${it.deferralNote}` : ''}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <RecommendationActions enrollmentId={it.enrollmentId} status={it.status} />
                    </td>
                    <td className="px-4 py-3">
                      <a
                        href={`/admin/members/${it.userId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                      >
                        <IconExternalLink className="h-4 w-4" />
                        查看會員
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
