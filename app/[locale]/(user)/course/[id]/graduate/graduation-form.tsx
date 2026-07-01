/*
 * ----------------------------------------------
 * GraduationForm - 課程結業三步驟表單
 * 2026-03-27
 * app/(user)/course/[id]/graduate/graduation-form.tsx
 * ----------------------------------------------
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import { IconStar, IconStarFilled } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { graduateCourse } from '@/app/actions/course-invite'
import { getMemberDisplayName, type DisplayNameMode } from '@/lib/utils/member-display'

// ── 型別定義 ──────────────────────────────────
type Student = {
  enrollmentId: number
  userId: string
  name: string | null
  email: string | null
  realName: string | null
  englishName: string | null
  nickname: string | null
  displayNameMode: DisplayNameMode
}

type StudentState = {
  graduated: boolean
  nonGraduateReason: string // 'insufficient_time' | 'other' | ''
}

type Step = 'fill' | 'preview'

type Props = {
  inviteId: number
  students: Student[]
}

// ── 五星評分（onChange 省略＝唯讀）──────────────
function StarRating({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= value
        const Icon = filled ? IconStarFilled : IconStar
        if (!onChange) {
          return <Icon key={n} className={`h-5 w-5 ${filled ? 'text-amber-500' : 'text-muted-foreground'}`} />
        }
        return (
          <button key={n} type="button" onClick={() => onChange(value === n ? 0 : n)} className="p-0.5">
            <Icon className={`h-6 w-6 ${filled ? 'text-amber-500' : 'text-muted-foreground hover:text-amber-400'}`} />
          </button>
        )
      })}
    </div>
  )
}

export function GraduationForm({ inviteId, students }: Props) {
  const t = useTranslations('course.gradForm')
  // value 送至後端（保留），label 在地化
  const NON_GRADUATE_REASONS: { value: string; label: string }[] = [
    { value: 'insufficient_time', label: t('reasonInsufficient') },
    { value: 'other', label: t('reasonOther') },
  ]
  const REASON_LABELS: Record<string, string> = {
    insufficient_time: t('reasonInsufficient'),
    other: t('reasonOther'),
  }
  const router = useRouter()
  const [step, setStep] = useState<Step>('fill')
  // 最後一堂課程日期
  const [lastCourseDate, setLastCourseDate] = useState('')
  // 每位學員的結業狀態（預設全員結業）
  const [studentStates, setStudentStates] = useState<Record<string, StudentState>>(() =>
    Object.fromEntries(students.map((s) => [s.userId, { graduated: true, nonGraduateReason: '' }]))
  )
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  // 本次學員整體學習狀況（皆選填）：五星（0＝未評）＋見證
  const [rating, setRating] = useState(0)
  const [testimony, setTestimony] = useState('')

  // ── 填寫步驟操作 ──────────────────────────────
  function toggleGraduated(userId: string) {
    setStudentStates((prev) => ({
      ...prev,
      [userId]: {
        graduated: !prev[userId].graduated,
        nonGraduateReason: !prev[userId].graduated ? '' : prev[userId].nonGraduateReason,
      },
    }))
    setErrors((prev) => {
      const next = { ...prev }
      delete next[`reason_${userId}`]
      return next
    })
  }

  function setReason(userId: string, reason: string) {
    setStudentStates((prev) => ({
      ...prev,
      [userId]: { ...prev[userId], nonGraduateReason: reason },
    }))
    setErrors((prev) => {
      const next = { ...prev }
      delete next[`reason_${userId}`]
      return next
    })
  }

  // ── 驗證並進入預覽 ────────────────────────────
  function handleToPreview() {
    const newErrors: Record<string, string> = {}

    if (!lastCourseDate) {
      newErrors.lastCourseDate = t('validateDate')
    }

    students.forEach((s) => {
      const state = studentStates[s.userId]
      if (!state.graduated && !state.nonGraduateReason) {
        newErrors[`reason_${s.userId}`] = t('validateReason')
      }
    })

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setErrors({})
    setStep('preview')
  }

  // ── 送出結業 ──────────────────────────────────
  async function handleSubmit() {
    setSubmitting(true)

    const enrollmentResults = students.map((s) => ({
      userId: s.userId,
      graduated: studentStates[s.userId].graduated,
      nonGraduateReason: studentStates[s.userId].nonGraduateReason || undefined,
    }))

    const result = await graduateCourse(
      inviteId,
      new Date(lastCourseDate),
      enrollmentResults,
      { rating: rating || null, testimony }
    )

    setSubmitting(false)

    if (result.success) {
      toast.success(t('success'))
      router.push(`/course/${inviteId}`)
    } else {
      toast.error(result.message ?? t('fail'))
    }
  }

  // ── 計算摘要 ──────────────────────────────────
  const graduatedStudents = students.filter((s) => studentStates[s.userId].graduated)
  const nonGraduatedStudents = students.filter((s) => !studentStates[s.userId].graduated)

  // ── 填寫步驟 ──────────────────────────────────
  if (step === 'fill') {
    return (
      <div className="space-y-6">
        {/* 步驟指示 */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">1. {t('stepFill')}</span>
          <span>→</span>
          <span>2. {t('stepPreview')}</span>
          <span>→</span>
          <span>3. {t('stepSubmit')}</span>
        </div>

        {/* 最後一堂課程日期 */}
        <div className="rounded-lg border p-5 space-y-3">
          <h2 className="text-sm font-medium">{t('lastClassDate')}</h2>
          <div className="space-y-1">
            <input
              type="date"
              value={lastCourseDate}
              onChange={(e) => {
                setLastCourseDate(e.target.value)
                setErrors((prev) => {
                  const next = { ...prev }
                  delete next.lastCourseDate
                  return next
                })
              }}
              className="flex h-9 w-full max-w-xs rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
            {errors.lastCourseDate && (
              <p className="text-xs text-destructive">{errors.lastCourseDate}</p>
            )}
          </div>
        </div>

        {/* 學員結業狀態 */}
        <div className="rounded-lg border p-5 space-y-4">
          <h2 className="text-sm font-medium">{t('studentStatus', { count: students.length })}</h2>

          {students.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('noApproved')}</p>
          ) : (
            <div className="space-y-4">
              {students.map((s) => {
                const state = studentStates[s.userId]
                return (
                  <div key={s.userId} className="space-y-2">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        id={`grad-${s.userId}`}
                        checked={state.graduated}
                        onCheckedChange={() => toggleGraduated(s.userId)}
                      />
                      <Label htmlFor={`grad-${s.userId}`} className="flex flex-col cursor-pointer">
                        <span className="text-sm font-medium">{getMemberDisplayName(s)}</span>
                        {s.email && (
                          <span className="text-xs text-muted-foreground">{s.email}</span>
                        )}
                      </Label>
                      {state.graduated && (
                        <span className="ml-auto text-xs text-green-600 font-medium">{t('graduated')}</span>
                      )}
                    </div>

                    {/* 未結業原因 */}
                    {!state.graduated && (
                      <div className="ml-7 space-y-1">
                        <Select
                          value={state.nonGraduateReason}
                          onValueChange={(v) => setReason(s.userId, v)}
                        >
                          <SelectTrigger className="w-48 h-8 text-sm">
                            <SelectValue placeholder={t('selectReason')} />
                          </SelectTrigger>
                          <SelectContent>
                            {NON_GRADUATE_REASONS.map((r) => (
                              <SelectItem key={r.value} value={r.value}>
                                {r.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors[`reason_${s.userId}`] && (
                          <p className="text-xs text-destructive">
                            {errors[`reason_${s.userId}`]}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* 本次學員整體學習狀況（選填） */}
        <div className="rounded-lg border p-5 space-y-4">
          <h2 className="text-sm font-medium">
            {t('overallTitle')}
            <span className="ml-1 text-xs font-normal text-muted-foreground">{t('overallOptional')}</span>
          </h2>
          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground">{t('ratingLabel')}</p>
            <StarRating value={rating} onChange={setRating} />
          </div>
          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground">{t('testimonyLabel')}</p>
            <Textarea
              value={testimony}
              onChange={(e) => setTestimony(e.target.value)}
              rows={4}
              maxLength={500}
              placeholder={t('testimonyPlaceholder')}
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={handleToPreview}>{t('nextPreview')}</Button>
        </div>
      </div>
    )
  }

  // ── 預覽步驟 ──────────────────────────────────
  return (
    <div className="space-y-6">
      {/* 步驟指示 */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>1. {t('stepFill')}</span>
        <span>→</span>
        <span className="font-medium text-foreground">2. {t('stepPreview')}</span>
        <span>→</span>
        <span>3. {t('stepSubmit')}</span>
      </div>

      {/* 預覽摘要 */}
      <div className="rounded-lg border p-5 space-y-4">
        <h2 className="text-sm font-medium">{t('previewTitle')}</h2>

        {/* 最後一堂課程日期 */}
        <div className="text-sm">
          <span className="text-muted-foreground">{t('lastClassDateColon')}</span>
          <span className="font-medium">{lastCourseDate}</span>
        </div>

        {/* 整體學習狀況（有值才顯示） */}
        {rating > 0 && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">{t('ratingLabel')}：</span>
            <StarRating value={rating} />
          </div>
        )}
        {testimony.trim() && (
          <div className="text-sm">
            <span className="text-muted-foreground">{t('testimonyLabel')}：</span>
            <p className="mt-1 whitespace-pre-wrap">{testimony.trim()}</p>
          </div>
        )}

        {/* 已結業 */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-green-700">
            {t('graduatedCount', { count: graduatedStudents.length })}
          </h3>
          {graduatedStudents.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('none')}</p>
          ) : (
            <ul className="space-y-1">
              {graduatedStudents.map((s) => (
                <li key={s.userId} className="text-sm flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
                  {getMemberDisplayName(s)}
                  {s.email && (
                    <span className="text-xs text-muted-foreground">{s.email}</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* 未結業 */}
        {nonGraduatedStudents.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-orange-700">
              {t('nonGraduatedCount', { count: nonGraduatedStudents.length })}
            </h3>
            <ul className="space-y-1">
              {nonGraduatedStudents.map((s) => (
                <li key={s.userId} className="text-sm flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-400 shrink-0" />
                  {getMemberDisplayName(s)}
                  {s.email && (
                    <span className="text-xs text-muted-foreground">{s.email}</span>
                  )}
                  <span className="text-xs text-orange-600">
                    — {REASON_LABELS[studentStates[s.userId].nonGraduateReason] ?? t('unknownReason')}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => setStep('fill')} disabled={submitting}>
          {t('backToEdit')}
        </Button>
        <Button onClick={handleSubmit} disabled={submitting}>
          {submitting ? t('processing') : t('confirmSubmit')}
        </Button>
      </div>
    </div>
  )
}
