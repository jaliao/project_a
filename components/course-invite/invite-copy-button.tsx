/*
 * ----------------------------------------------
 * InviteCopyButton - 分享課程連結按鈕
 * 2026-03-23 (Updated: 2026-03-26)
 * components/course-invite/invite-copy-button.tsx
 * ----------------------------------------------
 */

'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { IconShare, IconCheck } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'

interface InviteCopyButtonProps {
  courseId: number
}

export function InviteCopyButton({ courseId }: InviteCopyButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleShare = async () => {
    const link = `${window.location.origin}/course/${courseId}`
    if (navigator.share) {
      try {
        await navigator.share({ title: '課程連結', url: link })
      } catch {
        // 使用者取消分享，不顯示錯誤
      }
    } else {
      navigator.clipboard.writeText(link).then(() => {
        setCopied(true)
        toast.success('已複製課程連結！')
        setTimeout(() => setCopied(false), 2000)
      })
    }
  }

  return (
    <Button size="sm" variant="outline" onClick={handleShare}>
      {copied ? <IconCheck className="h-4 w-4 mr-1" /> : <IconShare className="h-4 w-4 mr-1" />}
      {copied ? '已複製！' : '分享'}
    </Button>
  )
}
