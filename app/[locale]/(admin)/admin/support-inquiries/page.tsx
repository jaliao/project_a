/*
 * ----------------------------------------------
 * 後台提問管理頁
 * 2026-07-22
 * app/[locale]/(admin)/admin/support-inquiries/page.tsx
 * ----------------------------------------------
 */

export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { getPaginatedInquiryList } from '@/lib/data/support-inquiry'
import { SupportInquiryCard } from '@/components/admin/support-inquiry-card'
import { cn } from '@/lib/utils'
import type { SupportInquiryStatus } from '@prisma/client'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from '@/components/ui/pagination'

// 頁碼視窗：總頁數 <=7 全列出；否則顯示頭尾＋目前頁前後各 1 頁，其餘以單一 'ellipsis' 收合
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

export const metadata: Metadata = {
  title: '提問管理 — 啟動事工',
}

export default async function AdminSupportInquiriesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>
}) {
  // 守衛（登入 + admin）由 (admin)/layout.tsx 統一處理
  const t = await getTranslations('supportInquiry')
  const sp = await searchParams
  const status = (['pending', 'replied', 'all'].includes(sp.status ?? '')
    ? sp.status
    : 'pending') as SupportInquiryStatus | 'all'
  const page = Math.max(1, Number(sp.page) || 1)

  const TABS: { value: SupportInquiryStatus | 'all'; label: string }[] = [
    { value: 'pending', label: t('statusPending') },
    { value: 'replied', label: t('statusReplied') },
    { value: 'all', label: t('tabAll') },
  ]

  const CATEGORY_LABELS: Record<string, string> = {
    account: t('categoryAccount'),
    course: t('categoryCourse'),
    material: t('categoryMaterial'),
    other: t('categoryOther'),
  }

  const result = await getPaginatedInquiryList({ status, page })

  const qs = (p: number) => {
    const params = new URLSearchParams()
    params.set('status', status)
    params.set('page', String(p))
    return `?${params.toString()}`
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{t('adminPageTitle')}</h1>
      </div>

      {/* 狀態分頁 */}
      <div className="flex flex-wrap gap-2">
        {TABS.map((tab) => (
          <Link
            key={tab.value}
            href={`?status=${tab.value}`}
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
        <p className="text-sm text-muted-foreground">{t('noInquiries')}</p>
      ) : (
        <>
          <div className="space-y-3">
            {result.items.map((inq) => (
              <SupportInquiryCard
                key={inq.id}
                id={inq.id}
                userId={inq.userId}
                isSubmitterDeleted={inq.isSubmitterDeleted}
                submitterName={inq.submitterName}
                submitterSpiritId={inq.submitterSpiritId}
                submitterRealName={inq.submitterRealName}
                submitterGenderLabel={inq.submitterGenderLabel}
                submitterChurchLabel={inq.submitterChurchLabel}
                categoryLabel={CATEGORY_LABELS[inq.category]}
                body={inq.body}
                status={inq.status}
                replyBody={inq.replyBody}
                repliedByName={inq.repliedByName}
                repliedAt={inq.repliedAt}
                createdAt={inq.createdAt}
                courseInviteId={inq.courseInviteId}
                courseTitle={inq.courseTitle}
              />
            ))}
          </div>

          {result.pageCount > 1 && (
            <div className="flex flex-col items-center gap-2 sm:flex-row sm:justify-between">
              <span className="text-sm text-muted-foreground">
                第 {result.page} / {result.pageCount} 頁・共 {result.total} 筆
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
                  {getPaginationRange(result.page, result.pageCount).map((p, i) =>
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
                      href={qs(Math.min(result.pageCount, result.page + 1))}
                      aria-disabled={result.page >= result.pageCount}
                      className={result.page >= result.pageCount ? 'pointer-events-none opacity-50' : undefined}
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
