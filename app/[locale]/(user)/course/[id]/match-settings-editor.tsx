/*
 * ----------------------------------------------
 * MatchSettingsEditor - 講師公開媒合設定（Client Component）
 * 2026-06-06
 * app/(user)/course/[id]/match-settings-editor.tsx
 * ----------------------------------------------
 */

'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { updateMatchSettings } from '@/app/actions/course-session'

interface Props {
  inviteId: number
  isPublicMatch: boolean
  matchNote: string | null
}

export function MatchSettingsEditor({ inviteId, isPublicMatch, matchNote }: Props) {
  const router = useRouter()
  const [isPublic, setIsPublic] = useState(isPublicMatch)
  const [note, setNote] = useState(matchNote ?? '')
  const [isPending, startTransition] = useTransition()

  const dirty = isPublic !== isPublicMatch || note !== (matchNote ?? '')

  const handleSave = () => {
    startTransition(async () => {
      const res = await updateMatchSettings(inviteId, { isPublicMatch: isPublic, matchNote: note })
      if (res.success) {
        toast.success(res.message ?? '已更新')
        router.refresh()
      } else {
        toast.error(res.message ?? '更新失敗，請稍後再試')
      }
    })
  }

  return (
    <div className="rounded-lg border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <p className="text-sm font-medium">公開媒合</p>
          <p className="text-xs text-muted-foreground">開啟後，此課程會出現在媒合布告欄供會員報名</p>
        </div>
        <Switch checked={isPublic} onCheckedChange={setIsPublic} disabled={isPending} />
      </div>

      {isPublic && (
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground">公開招募備註（最長 500 字）</label>
          <Textarea
            rows={3}
            value={note}
            maxLength={500}
            onChange={(e) => setNote(e.target.value)}
            placeholder="選填，會顯示在媒合布告欄"
          />
        </div>
      )}

      {dirty && (
        <Button size="sm" onClick={handleSave} disabled={isPending}>
          {isPending ? '儲存中…' : '儲存媒合設定'}
        </Button>
      )}
    </div>
  )
}
