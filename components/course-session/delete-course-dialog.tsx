/*
 * ----------------------------------------------
 * DeleteCourseDialog - 刪除課程確認對話視窗
 * 2026-08-11
 * components/course-session/delete-course-dialog.tsx
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
import { deleteCourseSession } from '@/app/actions/course-session'

type Props = {
  inviteId: number
  enrollCount: number
  graduatedCount: number
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DeleteCourseDialog({ inviteId, enrollCount, graduatedCount, open, onOpenChange }: Props) {
  const t = useTranslations('course.actions')
  const tm = useTranslations('course.material')
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  function handleClose() {
    if (loading) return
    onOpenChange(false)
  }

  async function handleConfirm() {
    setLoading(true)
    const result = await deleteCourseSession(inviteId)
    setLoading(false)
    if (result.success) {
      toast.success(result.message ?? t('deleteSuccessFallback'))
      onOpenChange(false)
      router.push('/admin/course-sessions')
    } else {
      toast.error(result.message ?? tm('genericFailFallback'))
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('deleteConfirmTitle')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-2 text-sm">
          {enrollCount > 0 ? (
            <p>{t('deleteConfirmEnrollLine', { count: enrollCount, graduated: graduatedCount })}</p>
          ) : (
            <p>{t('deleteConfirmNoEnroll')}</p>
          )}
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-red-700">
            {t('deleteConfirmWarning')}
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            {t('cancel')}
          </Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={loading}>
            {loading ? t('processing') : t('deleteButton')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
