/*
 * ----------------------------------------------
 * CourseDetailActions - 講師操作按鈕（結業、取消授課）
 * 2026-03-24 (Updated: 2026-03-26)
 * app/(user)/course/[id]/course-detail-actions.tsx
 * ----------------------------------------------
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { CancelCourseDialog } from '@/components/course-session/cancel-course-dialog'
import { startCourseSession } from '@/app/actions/course-invite'

type Props = {
  inviteId: number
  isCancelled: boolean
  isCompleted: boolean
  isStarted: boolean
  hasApprovedStudents: boolean
}

export function CourseDetailActions({
  inviteId,
  isCancelled,
  isCompleted,
  isStarted,
  hasApprovedStudents,
}: Props) {
  const router = useRouter()
  const [cancelOpen, setCancelOpen] = useState(false)
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

  if (!canAct) return null

  return (
    <div className="flex items-center gap-3 pt-2">
      {/* 開始上課按鈕（招生中才顯示） */}
      {!isStarted && (
        <Button onClick={handleStart} disabled={loading}>
          {loading ? '處理中...' : '開始上課'}
        </Button>
      )}

      {/* 結業按鈕：導向結業頁面 */}
      {hasApprovedStudents ? (
        <Button variant="outline" asChild>
          <Link href={`/course/${inviteId}/graduate`}>結業</Link>
        </Button>
      ) : (
        <Button
          variant="outline"
          onClick={() => toast.error('尚無已核准學員，無法結業')}
        >
          結業
        </Button>
      )}

      {/* 取消授課按鈕 */}
      <Button variant="destructive" onClick={() => setCancelOpen(true)}>
        取消授課
      </Button>

      {/* 取消授課 Dialog */}
      <CancelCourseDialog
        inviteId={inviteId}
        open={cancelOpen}
        onOpenChange={setCancelOpen}
      />
    </div>
  )
}
