/*
 * ----------------------------------------------
 * 後台提問管理 - 展開詳情與回覆
 * 2026-07-22
 * components/admin/support-inquiry-actions.tsx
 * ----------------------------------------------
 */

'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import { IconChevronDown, IconChevronRight } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { FieldError } from '@/components/ui/field-error'
import { replyInquiry, reopenInquiry } from '@/app/actions/support-inquiry'
import type { SupportInquiryStatus } from '@prisma/client'

function fmtDateTime(d: Date | null): string {
  return d ? new Date(d).toLocaleString('zh-TW') : '—'
}

export function SupportInquiryRow({
  id,
  submitterName,
  submitterSpiritId,
  categoryLabel,
  body,
  status,
  replyBody,
  repliedByName,
  repliedAt,
  createdAt,
}: {
  id: number
  submitterName: string
  submitterSpiritId: string | null
  categoryLabel: string
  body: string
  status: SupportInquiryStatus
  replyBody: string | null
  repliedByName: string | null
  repliedAt: Date | null
  createdAt: Date
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
    <>
      <tr className="align-top cursor-pointer hover:bg-muted/30" onClick={() => setExpanded((v) => !v)}>
        <td className="px-4 py-3">
          <div className="flex items-center gap-1.5">
            {expanded ? (
              <IconChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
            ) : (
              <IconChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            )}
            <span className="font-medium">{submitterName}</span>
          </div>
        </td>
        <td className="px-4 py-3">{categoryLabel}</td>
        <td className="px-4 py-3 max-w-xs truncate text-muted-foreground">{body}</td>
        <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">{fmtDateTime(createdAt)}</td>
        <td className="px-4 py-3">
          {status === 'replied' ? (
            <Badge className="bg-green-100 text-green-700 hover:bg-green-100">{t('statusReplied')}</Badge>
          ) : (
            <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">{t('statusPending')}</Badge>
          )}
        </td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={5} className="bg-muted/20 px-4 py-4">
            <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
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
          </td>
        </tr>
      )}
    </>
  )
}
