/*
 * ----------------------------------------------
 * CourseDetailActions - 講師操作按鈕（結業、取消授課）
 * 2026-03-24 (Updated: 2026-03-24)
 * app/(user)/course/[id]/course-detail-actions.tsx
 * ----------------------------------------------
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { CancelCourseDialog } from '@/components/course-session/cancel-course-dialog'
import { graduateCourse, startCourseSession } from '@/app/actions/course-invite'

type Props = {
  inviteId: number
  isCancelled: boolean
  isCompleted: boolean
  isStarted: boolean
}

export function CourseDetailActions({ inviteId, isCancelled, isCompleted, isStarted }: Props) {
  const router = useRouter()
  const [cancelOpen, setCancelOpen] = useState(false)
  const [graduateOpen, setGraduateOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const canAct = !isCancelled && !isCompleted

  async function handleStart() {
    setLoading(true)
    const result = await startCourseSession(inviteId)
    setLoading(false)
    if (result.success) {
      toast.success('課程已開始')
      router.refresh()
    } else {
      toast.error(result.message ?? '操作失敗，請稍後再試')
    }
  }

  async function handleGraduate() {
    setLoading(true)
    const result = await graduateCourse(inviteId)
    setLoading(false)
    if (result.success) {
      toast.success('課程已結業')
      setGraduateOpen(false)
      router.refresh()
    } else {
      toast.error(result.message ?? '操作失敗，請稍後再試')
    }
  }

  if (!canAct) return null

  return (
    <div className="flex items-center gap-3 pt-2">
      {/* 開始上課按鈕（招生中才顯示） */}
      {!isStarted && (
        <Button onClick={handleStart} disabled={loading}>
          {loading ? '處理中...' : '開始上課'}
        </Button>
      )}

      {/* 結業按鈕 */}
      <Button variant="outline" onClick={() => setGraduateOpen(true)}>
        結業
      </Button>

      {/* 取消授課按鈕 */}
      <Button variant="destructive" onClick={() => setCancelOpen(true)}>
        取消授課
      </Button>

      {/* 結業確認 Dialog */}
      <Dialog open={graduateOpen} onOpenChange={setGraduateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>確認結業</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-2">
            確認將此課程標記為已結業？此操作不可還原。
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGraduateOpen(false)} disabled={loading}>
              取消
            </Button>
            <Button onClick={handleGraduate} disabled={loading}>
              {loading ? '處理中...' : '確認結業'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 取消授課 Dialog */}
      <CancelCourseDialog
        inviteId={inviteId}
        open={cancelOpen}
        onOpenChange={setCancelOpen}
      />
    </div>
  )
}
