/*
 * ----------------------------------------------
 * 後台提問卡片 - 展開詳情與回覆（共用元件）
 * 2026-07-22
 * components/admin/support-inquiry-card.tsx
 *
 * 供「提問管理」列表頁與「會員詳情頁 → 會員提問」分頁共用。
 * ----------------------------------------------
 */

'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import { IconChevronDown, IconChevronRight, IconExternalLink } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { FieldError } from '@/components/ui/field-error'
import { replyInquiry, reopenInquiry } from '@/app/actions/support-inquiry'
import type { SupportInquiryStatus } from '@prisma/client'

function fmtDateTime(d: Date | null): string {
  return d ? new Date(d).toLocaleString('zh-TW') : '—'
}

export function SupportInquiryCard({
  id,
  userId,
  submitterName,
  submitterSpiritId,
  submitterRealName,
  submitterGenderLabel,
  submitterChurchLabel,
  categoryLabel,
  body,
  status,
  replyBody,
  repliedByName,
  repliedAt,
  createdAt,
  courseInviteId,
  courseTitle,
}: {
  id: number
  userId: string
  submitterName: string
  submitterSpiritId: string | null
  submitterRealName: string | null
  submitterGenderLabel: string
  submitterChurchLabel: string
  categoryLabel: string
  body: string
  status: SupportInquiryStatus
  replyBody: string | null
  repliedByName: string | null
  repliedAt: Date | null
  createdAt: Date
  courseInviteId: number | null
  courseTitle: string | null
}) {
  const t = useTranslations('supportInquiry')
  const router = useRouter()
  const [expanded, setExpanded] = useState(false)
  const [pending, startTransition] = useTransition()
  const [replyText, setReplyText] = useState(replyBody ?? '')
  const [errors, setErrors] = useState<Record<string, string[]>>({})

  function handleReply() {
    setErrors({})
    startTransition(async () => {
      const result = await replyInquiry(id, { replyBody: replyText })
      if (result.success) {
        toast.success(result.message ?? t('replySuccess'))
        router.refresh()
      } else if (result.errors) {
        setErrors(result.errors)
      } else {
        toast.error(result.message ?? t('replyFail'))
      }
    })
  }

  function handleReopen() {
    startTransition(async () => {
      const result = await reopenInquiry(id)
      if (result.success) {
        toast.success(result.message ?? t('reopenSuccess'))
        router.refresh()
      } else {
        toast.error(result.message ?? t('reopenFail'))
      }
    })
  }

  return (
    <div className="rounded-lg border overflow-hidden">
      <div
        className="flex items-center justify-between gap-3 px-4 py-3 cursor-pointer hover:bg-muted/30"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          {expanded ? (
            <IconChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
          ) : (
            <IconChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium">{submitterName}</span>
              {submitterRealName && (
                <span className="text-xs text-muted-foreground">（{submitterRealName}）</span>
              )}
              <span className="text-xs text-muted-foreground">
                {submitterGenderLabel} · {submitterChurchLabel}
              </span>
            </div>
            <p className="text-xs text-muted-foreground truncate">
              {categoryLabel} · {body}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-xs text-muted-foreground whitespace-nowrap">{fmtDateTime(createdAt)}</span>
          {status === 'replied' ? (
            <Badge className="bg-green-100 text-green-700 hover:bg-green-100">{t('statusReplied')}</Badge>
          ) : (
            <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">{t('statusPending')}</Badge>
          )}
        </div>
      </div>

      {expanded && (
        <div className="bg-muted/20 border-t px-4 py-4 space-y-3" onClick={(e) => e.stopPropagation()}>
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <Link
              href={`/admin/members/${userId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
            >
              {t('viewMemberLink')}
              <IconExternalLink className="h-3.5 w-3.5" />
            </Link>
            {courseInviteId && courseTitle && (
              <Link
                href={`/course/${courseInviteId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
              >
                {t('relatedCoursePrefix')}
                {courseTitle}
                <IconExternalLink className="h-3.5 w-3.5" />
              </Link>
            )}
          </div>

          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">
              {t('colSubmitter')}
              {submitterSpiritId ? `（${submitterSpiritId}）` : ''}
            </p>
            <p className="text-sm whitespace-pre-wrap">{body}</p>
          </div>

          {status === 'replied' && repliedByName && (
            <p className="text-xs text-muted-foreground">
              {t('repliedByPrefix')}
              {repliedByName}　·　{fmtDateTime(repliedAt)}
            </p>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">{t('replyLabel')}</label>
            <Textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              rows={4}
              disabled={pending}
            />
            <FieldError message={errors.replyBody?.[0]} />
          </div>

          <div className="flex items-center gap-2">
            <Button size="sm" onClick={handleReply} disabled={pending}>
              {pending ? t('submitting') : t('sendReply')}
            </Button>
            {status === 'replied' && (
              <Button size="sm" variant="outline" onClick={handleReopen} disabled={pending}>
                {t('reopenButton')}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
