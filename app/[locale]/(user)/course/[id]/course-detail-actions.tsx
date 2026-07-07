/*
 * ----------------------------------------------
 * CourseDetailActions - 講師操作區（三區塊：教材申請／開始上課／取消上課）
 * 2026-03-24 (Updated: 2026-07-07)
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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { CancelCourseDialog } from '@/components/course-session/cancel-course-dialog'
import { MaterialOrderDialog } from '@/components/course-session/material-order-dialog'
import type { BookItem } from '@/lib/data/material-items'
import { startCourseSession } from '@/app/actions/course-invite'
import { confirmReceipt, reportMaterialPayment, cancelCourseOrder } from '@/app/actions/course-order'
import { getMaterialOrderStatus } from '@/lib/utils/material-order-status'
import type { MaterialProgress } from '@/lib/utils/material-progress'
import type { CourseSessionOrder } from '@/lib/data/course-sessions'

type Props = {
  inviteId: number
  isCancelled: boolean
  isCompleted: boolean
  isStarted: boolean
  hasApprovedStudents: boolean
  // 已核准學員人數（開始上課確認視窗顯示用）
  approvedCount: number
  orders: CourseSessionOrder[]
  // 教材申請進度（總需求／已申請／尚未申請）
  progress: MaterialProgress
  // 開課門檻（≥1 已核准學員 + 教材全部收件）
  canStart: boolean
  startReasons: string[]
  // 單一地址收件人預設值（申請講師姓名 + 個人資料電話）
  defaultRecipient: { name: string; phone: string }
  // 尚未指派的書本項目（多地址逐本指派用）
  bookItems: BookItem[]
}

// 區塊外殼：標題 + 說明 + 動作
function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-lg border p-4 space-y-3">
      <h3 className="text-sm font-semibold">{title}</h3>
      {children}
    </div>
  )
}

// 繁/簡本數顯示
function bookLabel(trad: number, simp: number): string {
  const parts: string[] = []
  if (trad > 0) parts.push(`繁 ${trad}`)
  if (simp > 0) parts.push(`簡 ${simp}`)
  return parts.length > 0 ? parts.join('、') : '繁 0、簡 0'
}

const DELIVERY_LABELS: Record<string, string> = {
  sevenEleven: '7-11 超商',
  familyMart: '全家超商',
  delivery: '郵寄/宅配',
}

// 取貨方式一行文字（超商→門市（店號）；宅配→地址）
function deliveryLine(m: {
  deliveryMethod: string
  deliveryAddress: string | null
  storeId: string | null
  storeName: string | null
}): string {
  const label = DELIVERY_LABELS[m.deliveryMethod] ?? m.deliveryMethod
  if (m.deliveryMethod === 'delivery') {
    return m.deliveryAddress ? `${label} — ${m.deliveryAddress}` : label
  }
  const store = m.storeName ? `${m.storeName}${m.storeId ? `（${m.storeId}）` : ''}` : m.deliveryAddress
  return store ? `${label} — ${store}` : label
}

// 教材訂單內嵌資訊（取代原「查看」對話框）
function MaterialOrderInfo({ order }: { order: CourseSessionOrder }) {
  const fmt = (d: Date | null) => (d ? new Date(d).toLocaleString('zh-TW') : null)
  if (order.shipMode === 'multiple') {
    return (
      <div className="space-y-2 text-sm text-muted-foreground">
        {order.shipments.map((s, i) => (
          <div key={s.id} className="rounded border px-3 py-2 space-y-0.5">
            <p className="font-medium text-foreground">
              地址 {i + 1}
              <span className="ml-2 text-xs">{bookLabel(s.traditionalQty, s.simplifiedQty)}</span>
            </p>
            <p>取貨方式：{deliveryLine(s)}</p>
            <p>收件人：{s.recipientName || '—'}　·　{s.recipientPhone || '—'}</p>
            {s.items.length > 0 && (
              <ul className="space-y-0.5">
                {s.items.map((it, j) => (
                  <li key={j}>・{it.studentName}（{it.bookName}）· {it.version === 'traditional' ? '繁' : '簡'}</li>
                ))}
              </ul>
            )}
            {fmt(s.shippedAt) && <p>寄送時間：{fmt(s.shippedAt)}</p>}
          </div>
        ))}
        {fmt(order.receivedAt) && <p>收件時間：{fmt(order.receivedAt)}</p>}
      </div>
    )
  }
  return (
    <div className="space-y-0.5 text-sm text-muted-foreground">
      <p>書本數量：{bookLabel(order.traditionalQty, order.simplifiedQty)}</p>
      <p>取貨方式：{deliveryLine(order)}</p>
      <p>收件人：{order.recipientName || '—'}　·　{order.recipientPhone || '—'}</p>
      {fmt(order.shippedAt) && <p>寄送時間：{fmt(order.shippedAt)}</p>}
      {fmt(order.receivedAt) && <p>收件時間：{fmt(order.receivedAt)}</p>}
    </div>
  )
}

// 今天（本地時區）的 yyyy-mm-dd，供 <input type="date"> 預設與 max 使用
function todayInput(): string {
  const d = new Date()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

export function CourseDetailActions({
  inviteId,
  isCancelled,
  isCompleted,
  isStarted,
  hasApprovedStudents,
  approvedCount,
  orders,
  progress,
  canStart,
  startReasons,
  defaultRecipient,
  bookItems,
}: Props) {
  const router = useRouter()
  const [cancelOpen, setCancelOpen] = useState(false)
  // 教材申請 Dialog：僅用於「申請教材」（新訂單）；既有訂單改於列內嵌顯示
  const [materialOpen, setMaterialOpen] = useState(false)
  const [startLoading, setStartLoading] = useState(false)
  // 開始上課：所選開課日期（預設今天）與確認視窗
  const [startDate, setStartDate] = useState(todayInput())
  const [startConfirmOpen, setStartConfirmOpen] = useState(false)
  const [receiptPending, startReceiptTransition] = useTransition()
  const [paymentPending, startPaymentTransition] = useTransition()
  const [cancelPending, startCancelTransition] = useTransition()
  const [last5Map, setLast5Map] = useState<Record<number, string>>({})

  const canAct = !isCancelled && !isCompleted

  function openNewOrder() {
    setMaterialOpen(true)
  }

  function handleCancelOrder(orderId: number) {
    if (!window.confirm('確定要取消此教材申請？取消後可重新申請。')) return
    startCancelTransition(async () => {
      const result = await cancelCourseOrder(orderId)
      if (result.success) {
        toast.success(result.message ?? '已取消申請')
        router.refresh()
      } else {
        toast.error(result.message ?? '取消失敗，請稍後再試')
      }
    })
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
    const result = await startCourseSession(inviteId, startDate)
    setStartLoading(false)
    setStartConfirmOpen(false)
    if (result.success) {
      toast.success('課程已開始')
      router.refresh()
    } else {
      toast.error(result.message ?? '操作失敗，請稍後再試')
    }
  }

  if (!canAct) return null

  const { total, applied, remaining, canApplyMore } = progress

  return (
    <div className="space-y-3">
      {/* ── 區塊一：教材申請作業 ────────────────── */}
      {!isStarted && (
        <Section title="教材申請作業">
          {/* 說明：申請進度（總需求／已申請／尚未申請） */}
          <div className="rounded-md bg-muted/50 px-3 py-2 text-sm space-y-1">
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">總需求</span>
              <span>{bookLabel(total.traditional, total.simplified)}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">已申請</span>
              <span>{bookLabel(applied.traditional, applied.simplified)}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">尚未申請</span>
              <span className={cn(canApplyMore && 'font-medium text-amber-700')}>
                {bookLabel(remaining.traditional, remaining.simplified)}
              </span>
            </div>
          </div>

          {/* 訂單清單（每筆顯示書籍種類與數量＋狀態＋動作） */}
          {orders.length === 0 ? (
            <p className="text-sm text-muted-foreground">尚未申請教材，請在開始上課前完成申請。</p>
          ) : (
            <ul className="space-y-2">
              {orders.map((order) => {
                const status = getMaterialOrderStatus(order)
                return (
                  <li key={order.id} className="rounded-md border p-3 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium">
                        訂單 #{order.id}
                        <span className="ml-2 text-xs text-muted-foreground">
                          {bookLabel(order.traditionalQty, order.simplifiedQty)}
                        </span>
                      </span>
                      <span className={cn('rounded px-2 py-0.5 text-xs', status.tone)}>{status.label}</span>
                    </div>

                    {/* 內嵌顯示訂單寄送資訊 */}
                    <MaterialOrderInfo order={order} />

                    {status.key === 'pending_payment' && (
                      <div className="text-sm bg-amber-50 border border-amber-200 rounded-md px-3 py-2 space-y-2">
                        <p className="text-amber-800">
                          教材費用 <strong>NT${order.quotedAmount}</strong>，請匯款至：
                          <strong>{order.remittanceAccount}</strong>
                        </p>
                        <div className="flex items-center gap-2">
                          <Input
                            value={last5Map[order.id] ?? ''}
                            onChange={(e) => setLast5Map((m) => ({ ...m, [order.id]: e.target.value }))}
                            placeholder="匯款後五碼"
                            maxLength={5}
                            className="w-32"
                          />
                          <Button size="sm" onClick={() => handleReportPayment(order.id)} disabled={paymentPending}>
                            {paymentPending ? '送出中...' : '回填'}
                          </Button>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-2 flex-wrap">
                      {(status.key === 'pending_quote' || status.key === 'pending_payment') && canAct && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => handleCancelOrder(order.id)}
                          disabled={cancelPending}
                        >
                          {cancelPending ? '取消中...' : '取消申請'}
                        </Button>
                      )}
                      {status.key === 'shipped' && (
                        <Button size="sm" onClick={() => handleConfirmReceipt(order.id)} disabled={receiptPending}>
                          {receiptPending ? '確認中...' : '我已收到教材'}
                        </Button>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          )}

          {/* 動作：申請教材（僅尚未申請 > 0 可按） */}
          <div className="space-y-1">
            <Button variant="outline" size="sm" onClick={openNewOrder} disabled={!canApplyMore}>
              申請教材
            </Button>
            {!canApplyMore && (
              <p className="text-xs text-muted-foreground">
                {total.traditional + total.simplified === 0
                  ? '尚無已核准學員的選書需求。'
                  : '教材已全部申請。'}
              </p>
            )}
          </div>
        </Section>
      )}

      {/* ── 區塊二：開始上課作業 ────────────────── */}
      {!isStarted && (
        <Section title="開始上課作業">
          <div className="text-sm text-muted-foreground space-y-1">
            <p>注意事項：開始上課後課程狀態將變為「進行中」，並可開始辦理結業。</p>
            <p>需符合：①至少 1 位已核准學員；②所有教材訂單皆已收件。</p>
            {!canStart && startReasons.length > 0 && (
              <ul className="list-disc pl-5 text-amber-700">
                {startReasons.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            )}
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium" htmlFor="course-start-date">開始上課日期</label>
            <Input
              id="course-start-date"
              type="date"
              value={startDate}
              max={todayInput()}
              onChange={(e) => setStartDate(e.target.value)}
              disabled={startLoading}
              className="w-44"
            />
          </div>
          <Button
            onClick={() => {
              if (!startDate) {
                toast.error('請選擇開始上課日期')
                return
              }
              setStartConfirmOpen(true)
            }}
            disabled={startLoading || !canStart}
          >
            開始上課
          </Button>

          {/* 開始上課確認視窗：確認開課日期與人數後才執行 */}
          <Dialog open={startConfirmOpen} onOpenChange={setStartConfirmOpen}>
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle>確認開始上課</DialogTitle>
              </DialogHeader>
              <div className="space-y-2 text-sm">
                <p>
                  開課日期：<span className="font-medium">{startDate.replace(/-/g, '/')}</span>
                </p>
                <p>
                  上課人數：<span className="font-medium">{approvedCount} 位</span>（已核准學員）
                </p>
                <p className="text-muted-foreground">確認後課程狀態將變為「進行中」。</p>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setStartConfirmOpen(false)} disabled={startLoading}>
                  取消
                </Button>
                <Button onClick={handleStart} disabled={startLoading}>
                  {startLoading ? '處理中...' : '確認開始'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </Section>
      )}

      {/* 進行中：結業作業 */}
      {isStarted && (
        <Section title="結業作業">
          {hasApprovedStudents ? (
            <Button variant="outline" asChild>
              <Link href={`/course/${inviteId}/graduate`}>結業</Link>
            </Button>
          ) : (
            <Button variant="outline" onClick={() => toast.error('尚無已核准學員，無法結業')}>
              結業
            </Button>
          )}
        </Section>
      )}

      {/* ── 區塊三：取消上課作業 ────────────────── */}
      <Section title="取消上課作業">
        <Button variant="destructive" onClick={() => setCancelOpen(true)}>
          取消授課
        </Button>
      </Section>

      {/* 取消授課 Dialog */}
      <CancelCourseDialog
        inviteId={inviteId}
        open={cancelOpen}
        onOpenChange={setCancelOpen}
      />

      {/* 教材申請 Dialog（僅用於新申請；既有訂單於列內嵌顯示） */}
      <MaterialOrderDialog
        open={materialOpen}
        onOpenChange={setMaterialOpen}
        inviteId={inviteId}
        existingOrder={null}
        remaining={remaining}
        bookItems={bookItems}
        defaultRecipient={defaultRecipient}
      />
    </div>
  )
}
