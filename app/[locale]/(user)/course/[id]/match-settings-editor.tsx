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
import { useTranslations } from 'next-intl'
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
  const t = useTranslations()
  const router = useRouter()
  const [isPublic, setIsPublic] = useState(isPublicMatch)
  const [note, setNote] = useState(matchNote ?? '')
  const [isPending, startTransition] = useTransition()

  const dirty = isPublic !== isPublicMatch || note !== (matchNote ?? '')

  const handleSave = () => {
    startTransition(async () => {
      const res = await updateMatchSettings(inviteId, { isPublicMatch: isPublic, matchNote: note })
      if (res.success) {
        toast.success(res.message ?? t('course.match.updated'))
        router.refresh()
      } else {
        toast.error(res.message ?? t('course.match.updateFail'))
      }
    })
  }

  return (
    <div className="rounded-lg border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <p className="text-sm font-medium">{t('course.wizard.publicMatch')}</p>
          <p className="text-xs text-muted-foreground">{t('course.wizard.publicMatchHint')}</p>
        </div>
        <Switch checked={isPublic} onCheckedChange={setIsPublic} disabled={isPending} />
      </div>

      {isPublic && (
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground">{t('course.match.matchNoteLabel')}</label>
          <Textarea
            rows={3}
            value={note}
            maxLength={500}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t('course.match.matchNotePlaceholder')}
          />
        </div>
      )}

      {dirty && (
        <Button size="sm" onClick={handleSave} disabled={isPending}>
          {isPending ? t('course.match.saving') : t('course.match.save')}
        </Button>
      )}
    </div>
  )
}
