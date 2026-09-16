/*
 * ----------------------------------------------
 * EnrollmentApplicationDialog - 學員申請參加 + 書籍選購
 * 2026-03-24 (Updated: 2026-07-02)
 * components/course-session/enrollment-application-dialog.tsx
 * ----------------------------------------------
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { useTranslations } from 'next-intl'
import { applyToCourse, updateMyMaterialChoice } from '@/app/actions/course-invite'

type MaterialChoice = 'none' | 'traditional' | 'simplified' | 'english'

type Props = {
  inviteId: number
  open: boolean
  onOpenChange: (open: boolean) => void
  courseTitle: string
  courseDate?: string | null
  instructorName: string
  defaultBookName?: string
  mode?: 'apply' | 'edit'
  initialMaterialChoice?: MaterialChoice
  initialBookName?: string
}

export function EnrollmentApplicationDialog({
  inviteId,
  open,
  onOpenChange,
  courseTitle,
  courseDate,
  instructorName,
  defaultBookName = '',
  mode = 'apply',
  initialMaterialChoice,
  initialBookName,
}: Props) {
  const t = useTranslations()
  const MATERIAL_OPTIONS: { value: MaterialChoice; label: string; desc: string }[] = [
    { value: 'traditional', label: t('course.material.traditional'), desc: t('course.enroll.tradDesc') },
    { value: 'simplified', label: t('course.material.simplified'), desc: t('course.enroll.simpDesc') },
    { value: 'english', label: t('course.material.english'), desc: t('course.enroll.engDesc') },
    { value: 'none', label: t('course.material.none'), desc: t('course.enroll.noneDesc') },
  ]
  const router = useRouter()
  // 申請模式預選繁體教材，降低操作步驟；變更模式帶入該筆報名目前的選擇
  const initialChoice: MaterialChoice = initialMaterialChoice ?? 'traditional'
  const initialName = initialBookName ?? defaultBookName
  const [selected, setSelected] = useState<MaterialChoice | ''>(initialChoice)
  const [bookName, setBookName] = useState(initialName)
  const [loading, setLoading] = useState(false)

  function handleClose() {
    setSelected(initialChoice)
    setBookName(initialName)
    onOpenChange(false)
  }

  async function handleConfirm() {
    if (!selected) {
      toast.error(t('course.enroll.selectBook'))
      return
    }
    // 教材所屬姓名必填（選了需購買版本時）
    if (selected !== 'none' && !bookName.trim()) {
      toast.error(t('course.enroll.bookNameRequired'))
      return
    }
    setLoading(true)
    const result =
      mode === 'edit'
        ? await updateMyMaterialChoice(inviteId, selected, selected === 'none' ? undefined : bookName)
        : await applyToCourse(inviteId, selected, selected === 'none' ? undefined : bookName)
    setLoading(false)
    if (result.success) {
      toast.success(mode === 'edit' ? t('course.enroll.editSuccess') : t('course.enroll.success'))
      handleClose()
      router.refresh()
    } else {
      toast.error(result.message ?? t('course.enroll.fail'))
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === 'edit' ? t('course.enroll.editTitle') : t('course.enroll.chooseBook')}</DialogTitle>
        </DialogHeader>

        {/* 課程資訊確認區塊 */}
        <div className="rounded-lg bg-muted/50 border p-3 space-y-1 text-sm">
          <p className="font-medium">{courseTitle}</p>
          <p className="text-muted-foreground">{t('course.enroll.teacherLabel')}{instructorName}</p>
          {courseDate && (
            <p className="text-muted-foreground">{t('course.enroll.expectedStart')}{courseDate}</p>
          )}
        </div>

        <div className="space-y-3 py-2">
          {MATERIAL_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setSelected(opt.value)}
              className={cn(
                'w-full rounded-lg border p-4 text-left transition-colors',
                selected === opt.value
                  ? 'border-primary bg-primary/5'
                  : 'hover:bg-muted/50'
              )}
            >
              <p className="font-medium text-sm">{opt.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{opt.desc}</p>
            </button>
          ))}
        </div>

        {/* 教材所屬姓名（選了需購買版本才顯示；必填）*/}
        {(selected === 'traditional' || selected === 'simplified' || selected === 'english') && (
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              {t('course.enroll.bookNameLabel')}
              <span className="text-destructive ml-0.5">*</span>
            </label>
            <Input
              value={bookName}
              onChange={(e) => setBookName(e.target.value)}
              placeholder={t('course.enroll.bookNamePlaceholder')}
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">{t('course.enroll.bookNameNote')}</p>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleConfirm} disabled={loading || !selected}>
            {loading
              ? t('course.enroll.submitting')
              : mode === 'edit'
                ? t('course.enroll.confirmEdit')
                : t('course.enroll.confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
