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
}

export function StudentApplySection({
  inviteId,
  expiredAt,
  isCancelled,
  isCompleted,
  myEnrollment,
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

  // 可申請
  return (
    <>
      <Button onClick={() => setDialogOpen(true)}>申請參加</Button>
      <EnrollmentApplicationDialog
        inviteId={inviteId}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </>
  )
}
