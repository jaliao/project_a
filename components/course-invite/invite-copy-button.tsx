/*
 * ----------------------------------------------
 * InviteCopyButton - 複製邀請連結按鈕
 * 2026-03-23
 * components/course-invite/invite-copy-button.tsx
 * ----------------------------------------------
 */

'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { IconCopy, IconCheck } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'

interface InviteCopyButtonProps {
  courseId: number
}

export function InviteCopyButton({ courseId }: InviteCopyButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    const link = `${window.location.origin}/course/${courseId}`
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true)
      toast.success('已複製課程連結！')
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <Button size="sm" variant="outline" onClick={handleCopy}>
      {copied ? <IconCheck className="h-4 w-4 mr-1" /> : <IconCopy className="h-4 w-4 mr-1" />}
      {copied ? '已複製！' : '複製連結'}
    </Button>
  )
}
