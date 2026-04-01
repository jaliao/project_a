/*
 * ----------------------------------------------
 * CourseDetailActions - 講師操作按鈕（教材申請、結業、取消授課）
 * 2026-03-24 (Updated: 2026-03-30)
 * app/(user)/course/[id]/course-detail-actions.tsx
 * ----------------------------------------------
 */

'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { CancelCourseDialog } from '@/components/course-session/cancel-course-dialog'
import { MaterialOrderDialog } from '@/components/course-session/material-order-dialog'
import { startCourseSession } from '@/app/actions/course-invite'
import { confirmReceipt } from '@/app/actions/course-order'

type CourseOrder = {
  id: number
  buyerNameZh: string
  buyerNameEn: string
  teacherName: string
  churchOrg: string
  email: string
  phone: string
  courseDate: string
  taxId: string | null
  deliveryMethod: string
  deliveryAddress: string | null
  storeId: string | null
  storeName: string | null
  shippedAt: Date | null
  receivedAt: Date | null
}

type Props = {
  inviteId: number
  isCancelled: boolean
  isCompleted: boolean
  isStarted: boolean
  hasApprovedStudents: boolean
  courseOrder: CourseOrder | null
  courseDatePrefill?: string
  userPrefill?: {
    buyerNameZh?: string
    email?: string
  }
}

export function CourseDetailActions({
  inviteId,
  isCancelled,
  isCompleted,
  isStarted,
  hasApprovedStudents,
  courseOrder,
  courseDatePrefill,
  userPrefill,
}: Props) {
  const router = useRouter()
  const [cancelOpen, setCancelOpen] = useState(false)
  const [materialOpen, setMaterialOpen] = useState(false)
  const [startLoading, setStartLoading] = useState(false)
  const [receiptPending, startReceiptTransition] = useTransition()

  const canAct = !isCancelled && !isCompleted

  // 教材流程狀態
  const hasOrder = !!courseOrder
  const hasShipped = !!courseOrder?.shippedAt
  const hasReceived = !!courseOrder?.receivedAt

  async function handleStart() {
    setStartLoading(true)
    const result = await startCourseSession(inviteId)
    setStartLoading(false)
    if (result.success) {
      toast.success('課程已開始')
      router.refresh()
    } else {
      toast.error(result.message ?? '操作失敗，請稍後再試')
    }
  }

  function handleConfirmReceipt() {
    startReceiptTransition(async () => {
      const result = await confirmReceipt(inviteId)
      if (result.success) {
        toast.success(result.message ?? '已確認收件')
        router.refresh()
      } else {
        toast.error(result.message ?? '操作失敗，請稍後再試')
      }
    })
  }

  if (!canAct) return null

  return (
    <div className="space-y-3">

      {/* ── 教材申請區塊 ────────────────── */}
      {!hasReceived && (
        <div className="rounded-lg border p-4 space-y-3">
          <p className="text-sm font-medium text-muted-foreground">教材申請</p>

          {/* 狀態提示 */}
          {!hasOrder && (
            <p className="text-sm text-muted-foreground">尚未申請教材，請在開始上課前完成申請。</p>
          )}
          {hasOrder && !hasShipped && (
            <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
              教材申請中，等待管理者寄送
            </p>
          )}
          {hasShipped && !hasReceived && (
            <p className="text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded-md px-3 py-2">
              教材已寄出，請確認收件後開始上課
            </p>
          )}

          <div className="flex items-center gap-2 flex-wrap">
            {/* 申請教材 / 查看申請 按鈕 */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMaterialOpen(true)}
            >
              {hasOrder ? '查看教材申請' : '申請教材'}
            </Button>

            {/* 確認收件按鈕（已寄送但未收件時顯示） */}
            {hasShipped && !hasReceived && (
              <Button
                size="sm"
                onClick={handleConfirmReceipt}
                disabled={receiptPending}
              >
                {receiptPending ? '確認中...' : '我已收到教材'}
              </Button>
            )}
          </div>
        </div>
      )}

      {/* 已收件標籤 */}
      {hasReceived && (
        <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-md px-3 py-2">
          教材已收件
        </div>
      )}

      {/* ── 課程操作按鈕 ─────────────────── */}
      <div className="flex items-center gap-3 pt-1 flex-wrap">
        {/* 開始上課（招生中 + 已收件才顯示） */}
        {!isStarted && hasReceived && (
          <Button onClick={handleStart} disabled={startLoading}>
            {startLoading ? '處理中...' : '開始上課'}
          </Button>
        )}

        {/* 尚未收件時的提示 */}
        {!isStarted && !hasReceived && (
          <p className="text-xs text-muted-foreground">請先申請教材並確認收件，才能開始上課</p>
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
      </div>

      {/* 取消授課 Dialog */}
      <CancelCourseDialog
        inviteId={inviteId}
        open={cancelOpen}
        onOpenChange={setCancelOpen}
      />

      {/* 教材申請 Dialog */}
      <MaterialOrderDialog
        open={materialOpen}
        onOpenChange={setMaterialOpen}
        inviteId={inviteId}
        prefill={{
          buyerNameZh: userPrefill?.buyerNameZh,
          email: userPrefill?.email,
          courseDate: courseDatePrefill,
        }}
        existingOrder={courseOrder}
      />
    </div>
  )
}
