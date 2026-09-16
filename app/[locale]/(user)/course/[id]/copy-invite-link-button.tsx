/*
 * ----------------------------------------------
 * ShareCourseButton - 分享課程連結按鈕
 * 2026-03-24 (Updated: 2026-09-16)
 * app/(user)/course/[id]/copy-invite-link-button.tsx
 *
 * 手機／平板（依 User-Agent 判斷）維持叫用系統原生分享面板；
 * 桌機一律改開「分享課程」對話視窗：複製連結／LINE／Email／
 * 使用系統內建訊息邀請（cr-spec-260916-003）。
 *
 * ⚠️ 不可用「navigator.share 是否存在」判斷手機／桌機：Windows 版
 * Edge／Chrome 桌面瀏覽器也實作了 Web Share API（會叫出 Windows 內建
 * 分享面板），會誤判為手機而跳過引導對話視窗，故改用 UA 判斷裝置類型。
 * ----------------------------------------------
 */

'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import { IconShare, IconCopy, IconBrandLine, IconMail, IconMessage } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Link } from '@/i18n/navigation'
import { inviteMemberByMessage } from '@/app/actions/course-invite'

type Props = {
  courseId: number
  courseTitle: string
}

export function CopyInviteLinkButton({ courseId, courseTitle }: Props) {
  const t = useTranslations('course.copyLink')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [identifier, setIdentifier] = useState('')
  const [sending, setSending] = useState(false)
  const [sentToUserId, setSentToUserId] = useState<string | null>(null)

  function courseUrl() {
    return `${window.location.origin}/course/${courseId}`
  }

  // Windows 桌面版 Edge／Chrome 也支援 navigator.share，不能用其存在與否判斷手機／桌機
  function isMobileDevice() {
    return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
  }

  async function handleShare() {
    if (isMobileDevice() && navigator.share) {
      try {
        await navigator.share({ title: t('courseLink'), url: courseUrl() })
      } catch {
        // 使用者取消分享，不顯示錯誤
      }
    } else {
      setDialogOpen(true)
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(courseUrl())
    setCopied(true)
    toast.success(t('copied'))
    setTimeout(() => setCopied(false), 2000)
  }

  function handleLineShare() {
    const text = t('shareText', { title: courseTitle, link: courseUrl() })
    window.open(`https://line.me/R/msg/text/?${encodeURIComponent(text)}`, '_blank')
  }

  function handleEmailShare() {
    const subject = t('emailSubject', { title: courseTitle })
    const body = t('shareText', { title: courseTitle, link: courseUrl() })
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  }

  async function handleSendInvite() {
    const value = identifier.trim()
    if (!value) return

    setSending(true)
    const result = await inviteMemberByMessage(courseId, value)
    setSending(false)

    if (result.success) {
      toast.success(result.message ?? t('inviteSuccess'))
      setIdentifier('')
      setSentToUserId(result.data?.targetUserId ?? null)
    } else {
      const firstFieldError = result.errors ? Object.values(result.errors)[0]?.[0] : undefined
      toast.error(firstFieldError ?? result.message ?? t('inviteFail'))
    }
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={handleShare} className="w-fit gap-2">
        <IconShare className="h-4 w-4" />
        {t('share')}
      </Button>

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) setSentToUserId(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('dialogTitle')}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">{t('dialogDesc')}</p>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">{t('courseLink')}</label>
            <div className="flex gap-2">
              <Input value={courseUrl()} readOnly onFocus={(e) => e.target.select()} />
              <Button variant="outline" onClick={handleCopy} className="shrink-0 gap-1.5">
                <IconCopy className="h-4 w-4" />
                {copied ? t('copiedShort') : t('copyButton')}
              </Button>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={handleLineShare} className="flex-1 gap-1.5">
              <IconBrandLine className="h-4 w-4" />
              {t('lineButton')}
            </Button>
            <Button variant="outline" onClick={handleEmailShare} className="flex-1 gap-1.5">
              <IconMail className="h-4 w-4" />
              {t('emailButton')}
            </Button>
          </div>

          <div className="space-y-1.5 border-t pt-3">
            <label className="text-sm font-medium flex items-center gap-1.5">
              <IconMessage className="h-4 w-4" />
              {t('messageInviteTitle')}
            </label>
            <p className="text-xs text-muted-foreground">{t('messageInviteDesc')}</p>
            <div className="flex gap-2">
              <Input
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder={t('identifierPlaceholder')}
                disabled={sending}
              />
              <Button onClick={handleSendInvite} disabled={sending || !identifier.trim()} className="shrink-0">
                {t('sendInvite')}
              </Button>
            </div>
            {sentToUserId && (
              <Link
                href={`/messages?with=${sentToUserId}`}
                className="inline-block text-xs text-primary underline underline-offset-2"
              >
                {t('goToConversation')}
              </Link>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
