/*
 * ----------------------------------------------
 * CancelCourseDialog - 取消課程確認對話視窗
 * 2026-03-24
 * components/course-session/cancel-course-dialog.tsx
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { cancelCourseSession } from '@/app/actions/course-invite'

type Props = {
  inviteId: number
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CancelCourseDialog({ inviteId, open, onOpenChange }: Props) {
  const t = useTranslations()
  // value 為送至後端的原因（保留繁體），label 在地化顯示
  const PRESET_REASONS = [
    { value: '人數不足', label: t('course.cancel.reasonInsufficient') },
    { value: '時間因素', label: t('course.cancel.reasonTime') },
    { value: '__other__', label: t('course.cancel.reasonOther') },
  ]
  const router = useRouter()
  const [selected, setSelected] = useState('')
  const [customReason, setCustomReason] = useState('')
  const [loading, setLoading] = useState(false)

  const isOther = selected === '__other__'
  const finalReason = isOther ? customReason.trim() : selected

  function handleClose() {
    setSelected('')
    setCustomReason('')
    onOpenChange(false)
  }

  async function handleConfirm() {
    if (!finalReason) {
      toast.error(t('course.cancel.validateReason'))
      return
    }
    setLoading(true)
    const result = await cancelCourseSession(inviteId, finalReason)
    setLoading(false)
    if (result.success) {
      toast.success(t('course.cancel.success'))
      handleClose()
      router.refresh()
    } else {
      toast.error(result.message ?? t('course.cancel.fail'))
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('course.cancel.title')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>{t('course.cancel.reasonLabel')}</Label>
            <Select value={selected} onValueChange={setSelected}>
              <SelectTrigger>
                <SelectValue placeholder={t('course.cancel.selectReason')} />
              </SelectTrigger>
              <SelectContent>
                {PRESET_REASONS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isOther && (
            <div className="space-y-1.5">
              <Label>{t('course.cancel.explainReason')}</Label>
              <Textarea
                placeholder={t('course.cancel.reasonPlaceholder')}
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                rows={3}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            {t('common.cancel')}
          </Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={loading}>
            {loading ? t('course.cancel.processing') : t('course.cancel.title')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
