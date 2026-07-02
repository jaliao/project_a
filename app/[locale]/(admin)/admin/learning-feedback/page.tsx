/*
 * ----------------------------------------------
 * 後台學習歷程回饋審核頁
 * 2026-07-02
 * app/[locale]/(admin)/admin/learning-feedback/page.tsx
 * ----------------------------------------------
 */

export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import Link from 'next/link'
import { IconChevronLeft, IconChevronRight, IconExternalLink } from '@tabler/icons-react'
import { getLearningFeedbackList } from '@/lib/data/learning-feedback'
import { LearningFeedbackActions } from '@/components/admin/learning-feedback-actions'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { FeedbackCategory, FeedbackStatus } from '@prisma/client'

export const metadata: Metadata = {
  title: '學習歷程回饋 — 啟動事工',
}

const TABS: { value: FeedbackStatus | 'all'; label: string }[] = [
  { value: 'pending', label: '待處理' },
  { value: 'approved', label: '已處理' },
  { value: 'rejected', label: '已婉拒' },
  { value: 'all', label: '全部' },
]

const CATEGORY_LABELS: Record<FeedbackCategory, string> = {
  missing_record: '遺失學習歷程',
  wrong_teacher: '老師名稱錯誤',
  not_graduated: '應結業卻未結業',
}

function StatusBadge({ status }: { status: FeedbackStatus }) {
  if (status === 'approved')
    return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">已處理</Badge>
  if (status === 'rejected') return <Badge variant="secondary">已婉拒</Badge>
  return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">待處理</Badge>
}

function fmtDate(d: Date | null): string {
  return d
    ? new Date(d).toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' })
    : '—'
}

export default async function AdminLearningFeedbackPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>
}) {
  // 守衛（登入 + admin）由 (admin)/layout.tsx 統一處理
  const sp = await searchParams
  const status = (['pending', 'approved', 'rejected', 'all'].includes(sp.status ?? '')
    ? sp.status
    : 'pending') as FeedbackStatus | 'all'
  const page = Math.max(1, Number(sp.page) || 1)

  const result = await getLearningFeedbackList({ status, page })
  const qs = (p: number) => `?status=${status}&page=${p}`

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">學習歷程回饋</h1>
      </div>

      {/* 狀態分頁 */}
      <div className="flex flex-wrap gap-2">
        {TABS.map((tab) => (
          <Link
            key={tab.value}
            href={`?status=${tab.value}&page=1`}
            className={cn(
              'rounded-md px-3 py-1.5 text-sm',
              status === tab.value ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'
            )}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {result.items.length === 0 ? (
        <p className="text-sm text-muted-foreground">目前沒有回饋。</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr className="text-left text-muted-foreground">
                <th className="px-4 py-2.5 font-medium">送出者</th>
                <th className="px-4 py-2.5 font-medium">類別</th>
                <th className="px-4 py-2.5 font-medium">老師名稱</th>
                <th className="px-4 py-2.5 font-medium">課程</th>
                <th className="px-4 py-2.5 font-medium">備註</th>
                <th className="px-4 py-2.5 font-medium">送出時間</th>
                <th className="px-4 py-2.5 font-medium">狀態 / 操作</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {result.items.map((f) => (
                <tr key={f.id} className="align-top">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <span className="font-medium">{f.submitterName}</span>
                      {f.submitterSpiritId && (
                        <Link
                          href={`/user/${f.submitterSpiritId.toLowerCase()}`}
                          target="_blank"
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <IconExternalLink className="h-3.5 w-3.5" />
                        </Link>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">{CATEGORY_LABELS[f.category]}</td>
                  <td className="px-4 py-3">{f.teacherName}</td>
                  <td className="px-4 py-3">{f.courseCatalogLabel}</td>
                  <td className="px-4 py-3 text-muted-foreground">{f.note || '—'}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                    {fmtDate(f.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    {f.status === 'pending' ? (
                      <LearningFeedbackActions id={f.id} userId={f.userId} category={f.category} />
                    ) : (
                      <div className="space-y-0.5">
                        <StatusBadge status={f.status} />
                        {f.resolvedByName && (
                          <p className="text-xs text-muted-foreground">
                            {f.resolvedByName} · {fmtDate(f.resolvedAt)}
                          </p>
                        )}
                        {f.status === 'rejected' && f.adminNote && (
                          <p className="text-xs text-muted-foreground">{f.adminNote}</p>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 分頁 */}
      {result.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={result.page <= 1} asChild={result.page > 1}>
            {result.page > 1 ? (
              <Link href={qs(result.page - 1)}>
                <IconChevronLeft className="h-4 w-4" />
              </Link>
            ) : (
              <span>
                <IconChevronLeft className="h-4 w-4" />
              </span>
            )}
          </Button>
          <span className="text-sm text-muted-foreground">
            {result.page} / {result.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={result.page >= result.totalPages}
            asChild={result.page < result.totalPages}
          >
            {result.page < result.totalPages ? (
              <Link href={qs(result.page + 1)}>
                <IconChevronRight className="h-4 w-4" />
              </Link>
            ) : (
              <span>
                <IconChevronRight className="h-4 w-4" />
              </span>
            )}
          </Button>
        </div>
      )}
    </div>
  )
}
