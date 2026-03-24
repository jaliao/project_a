/*
 * ----------------------------------------------
 * CourseDetailActions - 課程詳情頁操作按鈕
 * 2026-03-24
 * app/(user)/course/[id]/course-detail-actions.tsx
 * ----------------------------------------------
 */

'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { CancelCourseDialog } from '@/components/course-session/cancel-course-dialog'

type Props = {
  inviteId: number
  isCancelled: boolean
}

export function CourseDetailActions({ inviteId, isCancelled }: Props) {
  const [dialogOpen, setDialogOpen] = useState(false)

  return (
    <div className="flex items-center gap-3 pt-2">
      {/* 結業申請（佔位） */}
      <Button
        variant="outline"
        disabled
        onClick={() => toast.info('功能即將開放')}
      >
        結業申請
      </Button>

      {/* 取消課程 */}
      {!isCancelled && (
        <>
          <Button variant="destructive" onClick={() => setDialogOpen(true)}>
            取消課程
          </Button>
          <CancelCourseDialog
            inviteId={inviteId}
            open={dialogOpen}
            onOpenChange={setDialogOpen}
          />
        </>
      )}
    </div>
  )
}
