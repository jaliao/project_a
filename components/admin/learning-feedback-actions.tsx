/*
 * ----------------------------------------------
 * 後台學習歷程回饋處理（建檔/更正老師/改結業/婉拒）
 * 2026-07-02
 * components/admin/learning-feedback-actions.tsx
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
  approveMissingRecord,
  approveWrongTeacher,
  fixNotGraduated,
  rejectFeedback,
  searchTeachersAction,
  getStudentEnrollmentsAction,
} from '@/app/actions/learning-feedback'
import type { FeedbackCategory } from '@prisma/client'
import type { TeacherOption, UserEnrollmentItem } from '@/lib/data/learning-feedback'

export function LearningFeedbackActions({
  id,
  userId,
  category,
}: {
  id: number
  userId: string
  category: FeedbackCategory
}) {
  const t = useTranslations('learningFeedback')
  const router = useRouter()
  const [pending, start] = useTransition()
  const [mode, setMode] = useState<null | 'process' | 'reject'>(null)

  const [q, setQ] = useState('')
  const [teachers, setTeachers] = useState<TeacherOption[]>([])
  const [teacher, setTeacher] = useState<TeacherOption | null>(null)

  const [enrollments, setEnrollments] = useState<UserEnrollmentItem[] | null>(null)
  const [enrollmentId, setEnrollmentId] = useState<number | null>(null)
  const [note, setNote] = useState('')

  const needsTeacher = category === 'missing_record' || category === 'wrong_teacher'
  const needsEnrollment = category === 'wrong_teacher' || category === 'not_graduated'

  const openProcess = () => {
    setMode('process')
    if (needsEnrollment && enrollments === null) {
      start(async () => setEnrollments(await getStudentEnrollmentsAction(userId)))
    }
  }

  const doSearch = () => start(async () => setTeachers(await searchTeachersAction(q)))

  const done = (res: { success: boolean; message?: string }) => {
    if (res.success) {
      toast.success(res.message ?? t('done'))
      router.refresh()
    } else {
      toast.error(res.message ?? t('actionFailed'))
    }
  }

  const submit = () =>
    start(async () => {
      if (category === 'missing_record') {
        if (!teacher) {
          toast.error(t('pickTeacher'))
          return
        }
        done(await approveMissingRecord(id, teacher.id))
      } else if (category === 'wrong_teacher') {
        if (!teacher) {
          toast.error(t('pickTeacher'))
          return
        }
        if (!enrollmentId) {
          toast.error(t('pickWrongClass'))
          return
        }
        done(await approveWrongTeacher(id, teacher.id, enrollmentId))
      } else {
        if (!enrollmentId) {
          toast.error(t('pickEnrollment'))
          return
        }
        done(await fixNotGraduated(id, enrollmentId))
      }
    })

  const doReject = () => start(async () => done(await rejectFeedback(id, note)))

  if (mode === null) {
    return (
      <div className="flex gap-1">
        <Button size="sm" variant="outline" className="h-7" onClick={openProcess}>
          {t('process')}
        </Button>
        <Button size="sm" variant="ghost" className="h-7" onClick={() => setMode('reject')}>
          {t('reject')}
        </Button>
      </div>
    )
  }

  if (mode === 'reject') {
    return (
      <div className="min-w-[14rem] space-y-1">
        <Textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          className="text-xs"
          placeholder={t('rejectNotePlaceholder')}
        />
        <div className="flex gap-1">
          <Button size="sm" variant="outline" className="h-7" disabled={pending} onClick={doReject}>
            {pending ? t('processing') : t('confirmReject')}
          </Button>
          <Button size="sm" variant="ghost" className="h-7" onClick={() => setMode(null)}>
            {t('cancel')}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-w-[16rem] space-y-2">
      {/* 老師選擇器 */}
      {needsTeacher && (
        <div className="space-y-1">
          <div className="flex gap-1">
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="h-7 text-xs"
              placeholder={t('teacherSearchPlaceholder')}
            />
            <Button size="sm" variant="outline" className="h-7" disabled={pending} onClick={doSearch}>
              {t('search')}
            </Button>
          </div>
          {teacher ? (
            <p className="text-xs">
              {t('selectedTeacher')}：<span className="font-medium">{teacher.name}</span>
              {teacher.teacherNo ? `（${teacher.teacherNo}）` : ''}
            </p>
          ) : (
            <div className="max-h-28 space-y-0.5 overflow-auto">
              {teachers.map((tc) => (
                <button
                  key={tc.id}
                  type="button"
                  className="block w-full rounded px-2 py-1 text-left text-xs hover:bg-muted"
                  onClick={() => setTeacher(tc)}
                >
                  {tc.name}
                  {tc.teacherNo ? `（${tc.teacherNo}）` : ''}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 既有報名定位 */}
      {needsEnrollment && (
        <div className="max-h-32 space-y-0.5 overflow-auto">
          {enrollments === null ? (
            <p className="text-xs text-muted-foreground">{t('loading')}</p>
          ) : enrollments.length === 0 ? (
            <p className="text-xs text-muted-foreground">{t('noEnrollments')}</p>
          ) : (
            enrollments.map((e) => (
              <label key={e.enrollmentId} className="flex items-start gap-2 text-xs">
                <input
                  type="radio"
                  name={`enr-${id}`}
                  className="mt-0.5"
                  checked={enrollmentId === e.enrollmentId}
                  onChange={() => setEnrollmentId(e.enrollmentId)}
                />
                <span>
                  {e.inviteTitle}
                  <span className="text-muted-foreground">
                    {' '}
                    · {e.teacherName} ·{' '}
                    {e.graduatedAt ? t('status_graduated') : t('status_notGraduated')}
                  </span>
                </span>
              </label>
            ))
          )}
        </div>
      )}

      <div className="flex gap-1">
        <Button size="sm" variant="outline" className="h-7" disabled={pending} onClick={submit}>
          {pending ? t('processing') : t('confirm')}
        </Button>
        <Button size="sm" variant="ghost" className="h-7" onClick={() => setMode(null)}>
          {t('cancel')}
        </Button>
      </div>
    </div>
  )
}
