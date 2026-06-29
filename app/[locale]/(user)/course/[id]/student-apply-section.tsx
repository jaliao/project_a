/*
 * ----------------------------------------------
 * StudentApplySection - 學員申請狀態與申請按鈕
 * 2026-03-24
 * app/(user)/course/[id]/student-apply-section.tsx
 * ----------------------------------------------
 */

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { EnrollmentApplicationDialog } from '@/components/course-session/enrollment-application-dialog'

type MyEnrollment = {
  id: number
  status: string
  materialChoice: string
} | null

type Props = {
  inviteId: number
  expiredAt: Date | null
  isCancelled: boolean
  isCompleted: boolean
  myEnrollment: MyEnrollment
  courseTitle: string
  courseDate?: string | null
  instructorName: string
  missingPrerequisites: { id: number; label: string }[]
}

export function StudentApplySection({
  inviteId,
  expiredAt,
  isCancelled,
  isCompleted,
  myEnrollment,
  courseTitle,
  courseDate,
  instructorName,
  missingPrerequisites,
}: Props) {
  const [dialogOpen, setDialogOpen] = useState(false)

  // 課程已取消或結業
  if (isCancelled || isCompleted) return null

  // 已有申請記錄
  if (myEnrollment) {
    if (myEnrollment.status === 'approved') {
      return (
        <div className="rounded-lg border bg-green-50 border-green-200 p-4 text-sm text-green-700 font-medium">
          ✓ 已加入此課程
        </div>
      )
    }
    return (
      <div className="rounded-lg border bg-amber-50 border-amber-200 p-4 text-sm text-amber-700 font-medium">
        ⏳ 申請審核中，等待講師同意
      </div>
    )
  }

  // 報名截止
  const isExpired = expiredAt && expiredAt < new Date()
  if (isExpired) {
    return (
      <div className="rounded-lg border p-4 text-sm text-muted-foreground font-medium">
        報名截止
      </div>
    )
  }

  const hasPrereqBlock = missingPrerequisites.length > 0

  return (
    <div className="space-y-3">
      <Button disabled={hasPrereqBlock} onClick={() => !hasPrereqBlock && setDialogOpen(true)}>
        申請參加
      </Button>

      {/* 先修課程不符資格提醒 */}
      {hasPrereqBlock && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          <p className="font-medium mb-1">尚未符合報名資格，須先完成以下課程：</p>
          <ul className="space-y-0.5">
            {missingPrerequisites.map((p) => (
              <li key={p.id} className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                {p.label}
              </li>
            ))}
          </ul>
        </div>
      )}

      {!hasPrereqBlock && (
        <EnrollmentApplicationDialog
          inviteId={inviteId}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          courseTitle={courseTitle}
          courseDate={courseDate}
          instructorName={instructorName}
        />
      )}
    </div>
  )
}
