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
import { getInquiryList } from '@/lib/data/support-inquiry'
import { SupportInquiryCard } from '@/components/admin/support-inquiry-card'
import { cn } from '@/lib/utils'
import type { SupportInquiryStatus } from '@prisma/client'

export const metadata: Metadata = {
  title: '提問管理 — 啟動事工',
}

export default async function AdminSupportInquiriesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  // 守衛（登入 + admin）由 (admin)/layout.tsx 統一處理
  const t = await getTranslations('supportInquiry')
  const sp = await searchParams
  const status = (['pending', 'replied', 'all'].includes(sp.status ?? '')
    ? sp.status
    : 'pending') as SupportInquiryStatus | 'all'

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

  const inquiries = await getInquiryList({ status })

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

      {inquiries.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('noInquiries')}</p>
      ) : (
        <div className="space-y-3">
          {inquiries.map((inq) => (
            <SupportInquiryCard
              key={inq.id}
              id={inq.id}
              userId={inq.userId}
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
      )}
    </div>
  )
}
