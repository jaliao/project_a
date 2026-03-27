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
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { graduateCourse } from '@/app/actions/course-invite'

// ── 型別定義 ──────────────────────────────────
type Student = {
  enrollmentId: number
  userId: string
  name: string | null
  email: string | null
}

type StudentState = {
  graduated: boolean
  nonGraduateReason: string // 'insufficient_time' | 'other' | ''
}

const NON_GRADUATE_REASONS: { value: string; label: string }[] = [
  { value: 'insufficient_time', label: '時間不足' },
  { value: 'other', label: '其他' },
]

const REASON_LABELS: Record<string, string> = {
  insufficient_time: '時間不足',
  other: '其他',
}

type Step = 'fill' | 'preview'

type Props = {
  inviteId: number
  students: Student[]
}

export function GraduationForm({ inviteId, students }: Props) {
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
      newErrors.lastCourseDate = '請填寫最後一堂課程日期'
    }

    students.forEach((s) => {
      const state = studentStates[s.userId]
      if (!state.graduated && !state.nonGraduateReason) {
        newErrors[`reason_${s.userId}`] = '請填寫未結業原因'
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
      enrollmentResults
    )

    setSubmitting(false)

    if (result.success) {
      toast.success('課程已結業')
      router.push(`/course/${inviteId}`)
    } else {
      toast.error(result.message ?? '操作失敗，請稍後再試')
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
          <span className="font-medium text-foreground">1. 填寫</span>
          <span>→</span>
          <span>2. 預覽</span>
          <span>→</span>
          <span>3. 送出</span>
        </div>

        {/* 最後一堂課程日期 */}
        <div className="rounded-lg border p-5 space-y-3">
          <h2 className="text-sm font-medium">最後一堂課程日期</h2>
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
          <h2 className="text-sm font-medium">學員結業狀態（{students.length} 人）</h2>

          {students.length === 0 ? (
            <p className="text-sm text-muted-foreground">尚無已核准學員</p>
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
                        <span className="text-sm font-medium">{s.name ?? '（未設定姓名）'}</span>
                        {s.email && (
                          <span className="text-xs text-muted-foreground">{s.email}</span>
                        )}
                      </Label>
                      {state.graduated && (
                        <span className="ml-auto text-xs text-green-600 font-medium">已結業</span>
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
                            <SelectValue placeholder="選擇未結業原因" />
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

        <div className="flex justify-end">
          <Button onClick={handleToPreview}>下一步：預覽結業結果</Button>
        </div>
      </div>
    )
  }

  // ── 預覽步驟 ──────────────────────────────────
  return (
    <div className="space-y-6">
      {/* 步驟指示 */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>1. 填寫</span>
        <span>→</span>
        <span className="font-medium text-foreground">2. 預覽</span>
        <span>→</span>
        <span>3. 送出</span>
      </div>

      {/* 預覽摘要 */}
      <div className="rounded-lg border p-5 space-y-4">
        <h2 className="text-sm font-medium">結業結果預覽</h2>

        {/* 最後一堂課程日期 */}
        <div className="text-sm">
          <span className="text-muted-foreground">最後一堂課程日期：</span>
          <span className="font-medium">{lastCourseDate}</span>
        </div>

        {/* 已結業 */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-green-700">
            已結業（{graduatedStudents.length} 人）
          </h3>
          {graduatedStudents.length === 0 ? (
            <p className="text-sm text-muted-foreground">無</p>
          ) : (
            <ul className="space-y-1">
              {graduatedStudents.map((s) => (
                <li key={s.userId} className="text-sm flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
                  {s.name ?? '（未設定姓名）'}
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
              未結業（{nonGraduatedStudents.length} 人）
            </h3>
            <ul className="space-y-1">
              {nonGraduatedStudents.map((s) => (
                <li key={s.userId} className="text-sm flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-400 shrink-0" />
                  {s.name ?? '（未設定姓名）'}
                  {s.email && (
                    <span className="text-xs text-muted-foreground">{s.email}</span>
                  )}
                  <span className="text-xs text-orange-600">
                    — {REASON_LABELS[studentStates[s.userId].nonGraduateReason] ?? '未知原因'}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => setStep('fill')} disabled={submitting}>
          返回修改
        </Button>
        <Button onClick={handleSubmit} disabled={submitting}>
          {submitting ? '處理中...' : '確認送出'}
        </Button>
      </div>
    </div>
  )
}
