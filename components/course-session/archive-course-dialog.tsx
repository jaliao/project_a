/*
 * ----------------------------------------------
 * ArchiveCourseDialog - 封存／解除封存課程確認對話視窗
 * 2026-08-11
 * components/course-session/archive-course-dialog.tsx
 * ----------------------------------------------
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { archiveCourseSession, unarchiveCourseSession } from '@/app/actions/course-session'

type Props = {
  inviteId: number
  isArchived: boolean
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ArchiveCourseDialog({ inviteId, isArchived, open, onOpenChange }: Props) {
  const t = useTranslations('course.actions')
  const tm = useTranslations('course.material')
  const router = useRouter()
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)

  function handleClose() {
    setReason('')
    onOpenChange(false)
  }

  async function handleConfirm() {
    setLoading(true)
    const result = isArchived
      ? await unarchiveCourseSession(inviteId)
      : await archiveCourseSession(inviteId, reason)
    setLoading(false)
    if (result.success) {
      toast.success(result.message ?? (isArchived ? t('unarchiveSuccessFallback') : t('archiveSuccessFallback')))
      handleClose()
      router.refresh()
    } else {
      toast.error(result.message ?? tm('genericFailFallback'))
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isArchived ? t('unarchiveConfirmTitle') : t('archiveConfirmTitle')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2 text-sm">
          <p className="text-muted-foreground">
            {isArchived ? t('unarchiveConfirmDesc') : t('archiveConfirmDesc')}
          </p>

          {!isArchived && (
            <div className="space-y-1.5">
              <Label>{t('archiveReasonLabel')}</Label>
              <Textarea
                placeholder={t('archiveReasonPlaceholder')}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            {t('cancel')}
          </Button>
          <Button onClick={handleConfirm} disabled={loading}>
            {loading ? t('processing') : isArchived ? t('unarchiveButton') : t('archiveButton')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
