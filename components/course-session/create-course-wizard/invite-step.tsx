/*
 * ----------------------------------------------
 * InviteStep - 精靈邀請學員階段
 * 2026-03-30
 * components/course-session/create-course-wizard/invite-step.tsx
 * ----------------------------------------------
 */

'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { IconCopy, IconCheck, IconSend } from '@tabler/icons-react'
import { inviteBySpirtId } from '@/app/actions/course-invite'

interface InviteStepProps {
  courseInviteId: number
  onClose: () => void
}

export function InviteStep({ courseInviteId, onClose }: InviteStepProps) {
  const [copied, setCopied] = useState(false)
  const [spiritId, setSpiritId] = useState('')
  const [spiritIdError, setSpiritIdError] = useState('')
  const [isPending, startTransition] = useTransition()

  const courseLink = `${window.location.origin}/course/${courseInviteId}`

  const handleCopy = () => {
    navigator.clipboard.writeText(courseLink).then(() => {
      setCopied(true)
      toast.success('已複製課程連結！')
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const handleInvite = () => {
    setSpiritIdError('')
    startTransition(async () => {
      const result = await inviteBySpirtId(courseInviteId, spiritId.trim())
      if (result.success) {
        toast.success(result.message ?? '邀請通知已送出')
        setSpiritId('')
      } else {
        setSpiritIdError(result.message ?? '邀請失敗，請稍後再試')
      }
    })
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">課程已建立成功！您可以複製連結或透過會員編號邀請學員。</p>

      {/* 複製連結 */}
      <div className="space-y-2">
        <p className="text-sm font-medium">邀請連結</p>
        <div className="flex items-center gap-2">
          <Input value={courseLink} readOnly className="text-xs text-muted-foreground" />
          <Button type="button" variant="outline" size="icon" onClick={handleCopy} className="shrink-0">
            {copied ? <IconCheck className="h-4 w-4" /> : <IconCopy className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Spirit ID 邀請 */}
      <div className="space-y-2">
        <p className="text-sm font-medium">透過會員編號邀請</p>
        <div className="flex items-center gap-2">
          <Input
            placeholder="輸入 Spirit ID（例：PA260001）"
            value={spiritId}
            onChange={(e) => {
              setSpiritId(e.target.value)
              if (spiritIdError) setSpiritIdError('')
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && spiritId.trim()) handleInvite()
            }}
          />
          <Button
            type="button"
            size="icon"
            disabled={!spiritId.trim() || isPending}
            onClick={handleInvite}
            className="shrink-0"
          >
            <IconSend className="h-4 w-4" />
          </Button>
        </div>
        {spiritIdError && (
          <p className="text-xs text-destructive">{spiritIdError}</p>
        )}
      </div>

      <Button type="button" variant="outline" className="w-full" onClick={onClose}>
        完成
      </Button>
    </div>
  )
}
