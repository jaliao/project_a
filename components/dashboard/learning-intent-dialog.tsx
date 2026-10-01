/*
 * ----------------------------------------------
 * LearningIntentDialog - 學員首頁「我想上課」刊登／編輯對話框
 * 2026-09-14
 * components/dashboard/learning-intent-dialog.tsx
 *
 * cr-spec-260914-001：選課程（複選）＋選上課時間條件（複選，含「其他」
 * 補充說明），送出呼叫 saveLearningIntent；已刊登時預填並提供取消刊登。
 * ----------------------------------------------
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { translateCatalogLabel } from '@/lib/utils/catalog-label'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { saveLearningIntent, cancelLearningIntent } from '@/app/actions/learning-intent'
import { LEARNING_TIME_PREFERENCE_VALUES } from '@/lib/schemas/learning-intent'
import type { CourseCatalogEntry } from '@/lib/data/course-catalog'
import type { MyLearningIntent } from '@/lib/data/learning-intent'
import { IconPlus, IconEdit } from '@tabler/icons-react'

type Props = {
  courses: CourseCatalogEntry[]
  myIntent: MyLearningIntent | null
}

export function LearningIntentDialog({ courses, myIntent }: Props) {
  const router = useRouter()
  const t = useTranslations('learningIntent')
  const tCatalog = useTranslations('catalog')
  const tValidation = useTranslations('validation')
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [courseIds, setCourseIds] = useState<number[]>(myIntent?.courseCatalogIds ?? [])
  const [timePrefs, setTimePrefs] = useState<string[]>(myIntent?.timePreferences ?? [])
  const [otherNote, setOtherNote] = useState(myIntent?.otherNote ?? '')

  function resetToCurrent() {
    setCourseIds(myIntent?.courseCatalogIds ?? [])
    setTimePrefs(myIntent?.timePreferences ?? [])
    setOtherNote(myIntent?.otherNote ?? '')
  }

  function toggleCourse(id: number) {
    setCourseIds((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]))
  }

  function toggleTimePref(value: string) {
    setTimePrefs((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]))
  }

  async function handleSubmit() {
    setSubmitting(true)
    const result = await saveLearningIntent({
      courseCatalogIds: courseIds,
      timePreferences: timePrefs,
      otherNote: otherNote.trim() || undefined,
    })
    setSubmitting(false)

    if (result.success) {
      toast.success(result.message ?? t('savedSuccess'))
      setOpen(false)
      router.refresh()
      return
    }

    if (result.errors) {
      const firstKey = Object.values(result.errors)[0]?.[0]
      toast.error(firstKey ? tValidation(firstKey) : (result.message ?? t('saveFailed')))
    } else {
      toast.error(result.message ?? t('saveFailed'))
    }
  }

  async function handleCancel() {
    setSubmitting(true)
    const result = await cancelLearningIntent()
    setSubmitting(false)
    if (result.success) {
      toast.success(result.message ?? t('cancelledSuccess'))
      setOpen(false)
      router.refresh()
    } else {
      toast.error(result.message ?? t('cancelFailed'))
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (next) resetToCurrent()
      }}
    >
      <Button variant={myIntent ? 'outline' : 'default'} onClick={() => setOpen(true)}>
        {myIntent ? <IconEdit className="mr-2 h-4 w-4" /> : <IconPlus className="mr-2 h-4 w-4" />}
        {myIntent ? t('editButton') : t('createButton')}
      </Button>

      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('dialogTitle')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{t('coursesLabel')}</Label>
            <div className="space-y-2">
              {courses.map((c) => (
                <div key={c.id} className="flex items-center gap-2">
                  <Checkbox
                    id={`course-${c.id}`}
                    checked={courseIds.includes(c.id)}
                    onCheckedChange={() => toggleCourse(c.id)}
                  />
                  <Label htmlFor={`course-${c.id}`} className="font-normal">
                    {translateCatalogLabel(tCatalog, c.label)}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t('timePreferenceLabel')}</Label>
            <div className="space-y-2">
              {LEARNING_TIME_PREFERENCE_VALUES.map((value) => (
                <div key={value} className="flex items-center gap-2">
                  <Checkbox
                    id={`time-${value}`}
                    checked={timePrefs.includes(value)}
                    onCheckedChange={() => toggleTimePref(value)}
                  />
                  <Label htmlFor={`time-${value}`} className="font-normal">
                    {t(`timePreference.${value}`)}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {timePrefs.includes('other') && (
            <div className="space-y-2">
              <Label htmlFor="other-note">{t('otherNoteLabel')}</Label>
              <Input
                id="other-note"
                value={otherNote}
                onChange={(e) => setOtherNote(e.target.value)}
                placeholder={t('otherNotePlaceholder')}
              />
            </div>
          )}
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
          {myIntent ? (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" className="text-destructive hover:text-destructive" disabled={submitting}>
                  {t('cancelPosting')}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t('cancelConfirm')}</AlertDialogTitle>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t('cancelConfirmNo')}</AlertDialogCancel>
                  <AlertDialogAction disabled={submitting} onClick={handleCancel}>
                    {t('cancelPosting')}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : (
            <span />
          )}
          <Button disabled={submitting} onClick={handleSubmit}>
            {t('submit')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
