/*
 * ----------------------------------------------
 * CopyInviteLinkButton - 複製邀請連結按鈕
 * 2026-03-24
 * app/(user)/course/[id]/copy-invite-link-button.tsx
 * ----------------------------------------------
 */

'use client'

import { useState } from 'react'
import { IconLink } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'

type Props = {
  courseId: number
}

export function CopyInviteLinkButton({ courseId }: Props) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    const url = `${window.location.origin}/course/${courseId}`
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Button variant="outline" onClick={handleCopy} className="w-fit gap-2">
      <IconLink className="h-4 w-4" />
      {copied ? '已複製！' : '複製課程連結'}
    </Button>
  )
}
