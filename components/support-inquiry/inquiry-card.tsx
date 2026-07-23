/*
 * ----------------------------------------------
 * InquiryCard - 單筆「聯繫管理者」提問卡片（共用顯示元件）
 * 2026-07-23
 * components/support-inquiry/inquiry-card.tsx
 *
 * 供「我的提問」（聯繫管理者）頁面清單與個人頁最近提問卡片共用
 * ----------------------------------------------
 */

import { getTranslations } from 'next-intl/server'
import { Badge } from '@/components/ui/badge'
import type { MyInquiryItem } from '@/lib/data/support-inquiry'

const CATEGORY_KEYS: Record<MyInquiryItem['category'], string> = {
  account: 'categoryAccount',
  course: 'categoryCourse',
  material: 'categoryMaterial',
  other: 'categoryOther',
}

export async function InquiryCard({ inquiry }: { inquiry: MyInquiryItem }) {
  const t = await getTranslations('supportInquiry')

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium">{t(CATEGORY_KEYS[inquiry.category])}</span>
        {inquiry.status === 'replied' ? (
          <Badge className="bg-green-100 text-green-700 hover:bg-green-100">{t('statusReplied')}</Badge>
        ) : (
          <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">{t('statusPending')}</Badge>
        )}
      </div>
      <p className="text-sm whitespace-pre-wrap">{inquiry.body}</p>
      <p className="text-xs text-muted-foreground">
        {t('createdAtPrefix')}
        {inquiry.createdAt.toLocaleString('zh-TW')}
      </p>
      {inquiry.courseTitle && (
        <p className="text-xs text-muted-foreground">
          {t('relatedCoursePrefix')}
          {inquiry.courseTitle}
        </p>
      )}
      {inquiry.status === 'replied' && (
        <div className="rounded-md bg-muted/50 px-3 py-2 space-y-1">
          <p className="text-sm whitespace-pre-wrap">{inquiry.replyBody}</p>
          <p className="text-xs text-muted-foreground">
            {t('repliedByPrefix')}
            {inquiry.repliedByName}　·　{t('repliedAtPrefix')}
            {inquiry.repliedAt?.toLocaleString('zh-TW')}
          </p>
        </div>
      )}
    </div>
  )
}
