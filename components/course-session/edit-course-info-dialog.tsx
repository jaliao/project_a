/*
 * ----------------------------------------------
 * EditCourseInfoDialog - 依課程狀態編輯課程資訊（Client Component）
 * 招生中：名稱／人數／截止日／開課日／備註；進行中：名稱＋開始日期；已結業：名稱＋開始日期＋結業日期
 * 2026-06-28 (Updated: 2026-07-07)
 * components/course-session/edit-course-info-dialog.tsx
 * ----------------------------------------------
 */

'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { updateCourseInfo } from '@/app/actions/course-session'

interface Props {
  inviteId: number
  approvedCount: number
  capacity?: number // 班級人數上限（來自系統設定）
  isAdmin?: boolean // 管理者可超過上限
  // 課程狀態決定可編輯欄位集（server 端另以 DB 狀態權威判定）
  state: 'recruiting' | 'started' | 'completed'
  initial: {
    title: string
    maxCount: number
    expiredAt: Date | null
    courseDate: string | null // YYYY/MM/DD
    notes: string | null
    startedAt: Date | null
    completedAt: Date | null
  }
}

// Date → yyyy-mm-dd（本地時區，供 <input type="date"> 使用）
function toDateInput(date: Date | null): string {
  if (!date) return ''
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function EditCourseInfoDialog({ inviteId, approvedCount, capacity = 7, isAdmin = false, state, initial }: Props) {
  const t = useTranslations()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const [title, setTitle] = useState(initial.title)
  const [maxCount, setMaxCount] = useState(String(initial.maxCount))
  const [expiredAt, setExpiredAt] = useState(toDateInput(initial.expiredAt))
  const [courseDate, setCourseDate] = useState((initial.courseDate ?? '').replace(/\//g, '-'))
  const [notes, setNotes] = useState(initial.notes ?? '')
  const [startedAt, setStartedAt] = useState(toDateInput(initial.startedAt))
  const [completedAt, setCompletedAt] = useState(toDateInput(initial.completedAt))

  const today = toDateInput(new Date())

  const handleSave = () => {
    if (!title.trim()) {
      toast.error(t('course.editInfo.nameRequired'))
      return
    }
    // 依狀態組送出欄位（server 端以 DB 狀態權威套白名單）
    if (state === 'recruiting') {
      if (!expiredAt || !courseDate) {
        toast.error(t('course.editInfo.selectDates'))
        return
      }
    } else if (!startedAt || (state === 'completed' && !completedAt)) {
      toast.error(t('course.editInfo.selectDates'))
      return
    }
    startTransition(async () => {
      const res = await updateCourseInfo(
        inviteId,
        state === 'recruiting'
          ? {
            title: title.trim(),
            maxCount: Number(maxCount),
            expiredAt: new Date(expiredAt),
            courseDate: new Date(courseDate),
            notes,
          }
          : state === 'started'
            ? { title: title.trim(), startedAt: new Date(startedAt) }
            : { title: title.trim(), startedAt: new Date(startedAt), completedAt: new Date(completedAt) }
      )
      if (res.success) {
        toast.success(res.message ?? t('course.editInfo.success'))
        setOpen(false)
        router.refresh()
      } else {
        const firstError = res.errors ? Object.values(res.errors).flat()[0] : undefined
        toast.error(res.message ?? firstError ?? t('course.editInfo.fail'))
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          {t('course.editInfo.title')}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('course.editInfo.title')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">{t('course.editInfo.courseName')}</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} disabled={isPending} />
          </div>

          {state === 'recruiting' && (
            <>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">{t('course.editInfo.maxCount')}</label>
                <Input
                  type="number"
                  min={1}
                  max={isAdmin ? 999 : capacity}
                  value={maxCount}
                  onChange={(e) => setMaxCount(e.target.value)}
                  disabled={isPending}
                  className="w-28"
                />
                <p className="text-xs text-muted-foreground">
                  {isAdmin ? t('course.editInfo.maxHintAdmin') : t('course.editInfo.maxHint', { max: capacity })}
                  {approvedCount > 0 && t('course.editInfo.maxHintApproved', { count: approvedCount })}
                </p>
              </div>

              <div className="flex gap-3">
                <div className="flex-1 space-y-1.5">
                  <label className="text-sm font-medium">{t('course.editInfo.deadline')}</label>
                  <Input type="date" value={expiredAt} onChange={(e) => setExpiredAt(e.target.value)} disabled={isPending} />
                </div>
                <div className="flex-1 space-y-1.5">
                  <label className="text-sm font-medium">{t('course.editInfo.startDate')}</label>
                  <Input type="date" value={courseDate} onChange={(e) => setCourseDate(e.target.value)} disabled={isPending} />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">{t('course.editInfo.notes')}</label>
                <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} disabled={isPending} placeholder={t('course.editInfo.optional')} />
              </div>
            </>
          )}

          {state !== 'recruiting' && (
            <div className="flex gap-3">
              <div className="flex-1 space-y-1.5">
                <label className="text-sm font-medium">{t('course.detail.startedDate')}</label>
                <Input
                  type="date"
                  value={startedAt}
                  max={today}
                  onChange={(e) => setStartedAt(e.target.value)}
                  disabled={isPending}
                />
              </div>
              {state === 'completed' && (
                <div className="flex-1 space-y-1.5">
                  <label className="text-sm font-medium">{t('course.detail.completedDate')}</label>
                  <Input
                    type="date"
                    value={completedAt}
                    min={startedAt || undefined}
                    max={today}
                    onChange={(e) => setCompletedAt(e.target.value)}
                    disabled={isPending}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleSave} disabled={isPending}>
            {isPending ? t('course.editInfo.saving') : t('common.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
