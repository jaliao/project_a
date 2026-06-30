/*
 * ----------------------------------------------
 * ShareCourseButton - 分享課程連結按鈕
 * 2026-03-24 (Updated: 2026-03-26)
 * app/(user)/course/[id]/copy-invite-link-button.tsx
 * ----------------------------------------------
 */

'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import { IconShare } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'

type Props = {
  courseId: number
}

export function CopyInviteLinkButton({ courseId }: Props) {
  const t = useTranslations('course.copyLink')
  const [copied, setCopied] = useState(false)

  async function handleShare() {
    const url = `${window.location.origin}/course/${courseId}`
    if (navigator.share) {
      try {
        await navigator.share({ title: t('courseLink'), url })
      } catch {
        // 使用者取消分享，不顯示錯誤
      }
    } else {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      toast.success(t('copied'))
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handleShare} className="w-fit gap-2">
      <IconShare className="h-4 w-4" />
      {copied ? t('copiedShort') : t('share')}
    </Button>
  )
}
