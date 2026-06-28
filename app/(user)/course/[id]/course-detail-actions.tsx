/*
 * ----------------------------------------------
 * CourseDetailActions - 講師操作按鈕（教材申請、開課、結業、取消授課）
 * 2026-03-24 (Updated: 2026-06-28)
 * app/(user)/course/[id]/course-detail-actions.tsx
 * ----------------------------------------------
 */

'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { CancelCourseDialog } from '@/components/course-session/cancel-course-dialog'
import { MaterialOrderDialog } from '@/components/course-session/material-order-dialog'
import { startCourseSession } from '@/app/actions/course-invite'
import { confirmReceipt, reportMaterialPayment } from '@/app/actions/course-order'
import { getMaterialOrderStatus } from '@/lib/utils/material-order-status'
import type { CourseSessionOrder } from '@/lib/data/course-sessions'

type Props = {
  inviteId: number
  isCancelled: boolean
  isCompleted: boolean
  isStarted: boolean
  hasApprovedStudents: boolean
  orders: CourseSessionOrder[]
  // 開課門檻（≥1 已核准學員 + 教材全部收件）
  canStart: boolean
  startReasons: string[]
  materialSummary: { traditional: number; simplified: number }
  // 單一地址收件人預設值（申請講師姓名 + 個人資料電話）
  defaultRecipient: { name: string; phone: string }
}

export function CourseDetailActions({
  inviteId,
  isCancelled,
  isCompleted,
  isStarted,
  hasApprovedStudents,
  orders,
  canStart,
  startReasons,
  materialSummary,
  defaultRecipient,
}: Props) {
  const router = useRouter()
  const [cancelOpen, setCancelOpen] = useState(false)
  // 教材申請 Dialog：dialogOrder = null 代表「再申請一筆」（新訂單），否則為檢視既有訂單
  const [materialOpen, setMaterialOpen] = useState(false)
  const [dialogOrder, setDialogOrder] = useState<CourseSessionOrder | null>(null)
  const [startLoading, setStartLoading] = useState(false)
  const [receiptPending, startReceiptTransition] = useTransition()
  const [paymentPending, startPaymentTransition] = useTransition()
  const [last5Map, setLast5Map] = useState<Record<number, string>>({})

  const canAct = !isCancelled && !isCompleted

  function openNewOrder() {
    setDialogOrder(null)
    setMaterialOpen(true)
  }

  function openViewOrder(order: CourseSessionOrder) {
    setDialogOrder(order)
    setMaterialOpen(true)
  }

  function handleReportPayment(orderId: number) {
    startPaymentTransition(async () => {
      const result = await reportMaterialPayment(orderId, last5Map[orderId] ?? '')
      if (result.success) {
        toast.success(result.message ?? '已回填匯款資訊')
        setLast5Map((m) => ({ ...m, [orderId]: '' }))
        router.refresh()
      } else {
        toast.error(result.errors?.last5?.[0] ?? result.message ?? '操作失敗，請稍後再試')
      }
    })
  }

  function handleConfirmReceipt(orderId: number) {
    startReceiptTransition(async () => {
      const result = await confirmReceipt(orderId)
      if (result.success) {
        toast.success(result.message ?? '已確認收件')
        router.refresh()
      } else {
        toast.error(result.message ?? '操作失敗，請稍後再試')
      }
    })
  }

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

  if (!canAct) return null

  return (
    <div className="space-y-3">
      {/* ── 教材申請區塊 ────────────────── */}
      {!isStarted && (
        <div className="rounded-lg border p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium text-muted-foreground">教材申請</p>
            <Button variant="outline" size="sm" onClick={openNewOrder}>
              {orders.length === 0 ? '申請教材' : '再申請一筆教材'}
            </Button>
          </div>

          {orders.length === 0 && (
            <p className="text-sm text-muted-foreground">尚未申請教材，請在開始上課前完成申請。</p>
          )}

          {/* 訂單清單（每筆各自顯示階段與動作） */}
          {orders.map((order) => {
            const status = getMaterialOrderStatus(order)
            return (
              <div key={order.id} className="rounded-md border p-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium">教材訂單 #{order.id}</span>
                  <span className={cn('rounded px-2 py-0.5 text-xs', status.tone)}>{status.label}</span>
                </div>

                {status.key === 'pending_quote' && (
                  <p className="text-sm text-gray-700">教材申請已送出，等待管理者批價</p>
                )}
                {status.key === 'pending_payment' && (
                  <div className="text-sm bg-amber-50 border border-amber-200 rounded-md px-3 py-2 space-y-2">
                    <p className="text-amber-800">
                      教材費用 <strong>NT${order.quotedAmount}</strong>，請匯款至：
                      <strong>{order.remittanceAccount}</strong>
                    </p>
                    <p className="text-amber-700 text-xs">完成 ATM 轉帳後，請回填匯款帳號後五碼：</p>
                    <div className="flex items-center gap-2">
                      <Input
                        value={last5Map[order.id] ?? ''}
                        onChange={(e) => setLast5Map((m) => ({ ...m, [order.id]: e.target.value }))}
                        placeholder="後五碼"
                        maxLength={5}
                        className="w-28"
                      />
                      <Button size="sm" onClick={() => handleReportPayment(order.id)} disabled={paymentPending}>
                        {paymentPending ? '送出中...' : '回填'}
                      </Button>
                    </div>
                  </div>
                )}
                {status.key === 'pending_confirm' && (
                  <p className="text-sm text-orange-700">已回填匯款後五碼，等待管理者確認收款</p>
                )}
                {status.key === 'pending_ship' && (
                  <p className="text-sm text-amber-700">款項已確認，等待管理者寄送教材</p>
                )}
                {status.key === 'shipped' && (
                  <p className="text-sm text-blue-700">教材已寄出，請確認收件</p>
                )}
                {status.key === 'received' && (
                  <p className="text-sm text-green-700">教材已收件</p>
                )}

                <div className="flex items-center gap-2 flex-wrap">
                  <Button variant="outline" size="sm" onClick={() => openViewOrder(order)}>
                    查看教材申請
                  </Button>
                  {status.key === 'shipped' && (
                    <Button size="sm" onClick={() => handleConfirmReceipt(order.id)} disabled={receiptPending}>
                      {receiptPending ? '確認中...' : '我已收到教材'}
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── 課程操作按鈕 ─────────────────── */}
      <div className="flex items-center gap-3 pt-1 flex-wrap">
        {/* 開始上課：招生中常駐顯示；未達門檻時停用並列出原因 */}
        {!isStarted && (
          <div className="space-y-1">
            <Button onClick={handleStart} disabled={startLoading || !canStart}>
              {startLoading ? '處理中...' : '開始上課'}
            </Button>
            {!canStart && startReasons.length > 0 && (
              <ul className="list-disc pl-5 text-xs text-muted-foreground">
                {startReasons.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* 結業按鈕：僅課程進行中（isStarted）才顯示 */}
        {isStarted && (
          hasApprovedStudents ? (
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
          )
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

      {/* 教材申請 Dialog（dialogOrder=null 為新訂單，否則檢視既有訂單） */}
      <MaterialOrderDialog
        open={materialOpen}
        onOpenChange={setMaterialOpen}
        inviteId={inviteId}
        existingOrder={dialogOrder}
        materialSummary={materialSummary}
        defaultRecipient={defaultRecipient}
      />
    </div>
  )
}
