/*
 * ----------------------------------------------
 * CourseDetailActions - 課程操作區
 * 2026-03-24 (Updated: 2026-07-20)
 * app/(user)/course/[id]/course-detail-actions.tsx
 *
 * 分區塊權限：教材申請＝講師與管理者；開始上課僅該課講師；
 * 結業作業／重新招募作業／取消上課作業＝講師與管理者皆可
 * ----------------------------------------------
 */

'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { IconBook, IconPlayerPlay, IconCertificate, IconBan, IconRefresh, IconChecks } from '@tabler/icons-react'
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
import { startCourseSession, revertGraduation } from '@/app/actions/course-invite'
import { reopenRecruitment } from '@/app/actions/course-session'
import {
  confirmReceipt,
  reportMaterialPayment,
  cancelCourseOrder,
  finalizeMaterialOrders,
  reopenMaterialOrders,
} from '@/app/actions/course-order'
import { getMaterialOrderStatus } from '@/lib/utils/material-order-status'
import type { MaterialProgress } from '@/lib/utils/material-progress'
import type { CourseSessionOrder } from '@/lib/data/course-sessions'

type Props = {
  inviteId: number
  // 是否為該課講師（開始上課僅講師可見；其餘作業講師與管理者皆可）
  isInstructor: boolean
  // 教材申請作業：講師本人或管理者可見可操作
  canManageMaterials: boolean
  isCancelled: boolean
  isCompleted: boolean
  isStarted: boolean
  hasApprovedStudents: boolean
  // 已核准學員人數（開始上課確認視窗顯示用）
  approvedCount: number
  orders: CourseSessionOrder[]
  // 教材申請進度（總需求／已申請／尚未申請；依學員申請統計之參考值）
  progress: MaterialProgress
  // 教材申請完成標記（有值＝不需再申請教材）
  materialFinalizedAt: Date | null
  // 開課門檻（≥1 已核准學員 + 教材需求已處理 + 教材全部收件）
  canStart: boolean
  startReasons: string[]
  // 單一地址收件人預設值（申請講師姓名 + 個人資料電話）
  defaultRecipient: { name: string; phone: string }
  // 尚未指派的書本項目（多地址逐本指派用）
  bookItems: BookItem[]
}

// 區塊外殼：標題（icon＋粗體，比照學員頁面標準）+ 說明 + 動作
function Section({
  title,
  icon,
  children,
}: {
  title: string
  icon?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="rounded-lg border p-4 space-y-3">
      <div className="flex items-center gap-2">
        {icon}
        <h3 className="text-base font-semibold">{title}</h3>
      </div>
      {children}
    </div>
  )
}

// 繁/簡/英本數顯示（版本標籤由呼叫端以 t() 翻譯後傳入）
function bookLabel(
  trad: number,
  simp: number,
  eng: number,
  labels: { trad: string; simp: string; eng: string }
): string {
  const parts: string[] = []
  if (trad > 0) parts.push(`${labels.trad} ${trad}`)
  if (simp > 0) parts.push(`${labels.simp} ${simp}`)
  if (eng > 0) parts.push(`${labels.eng} ${eng}`)
  return parts.length > 0 ? parts.join('、') : `${labels.trad} 0、${labels.simp} 0、${labels.eng} 0`
}

// 取貨方式一行文字（超商→門市（店號）；宅配→地址；label 由呼叫端以 t() 翻譯後傳入）
function deliveryLine(
  m: {
    deliveryMethod: string
    deliveryAddress: string | null
    storeId: string | null
    storeName: string | null
  },
  deliveryLabels: Record<string, string>
): string {
  const label = deliveryLabels[m.deliveryMethod] ?? m.deliveryMethod
  if (m.deliveryMethod === 'delivery') {
    return m.deliveryAddress ? `${label} — ${m.deliveryAddress}` : label
  }
  const store = m.storeName ? `${m.storeName}${m.storeId ? `（${m.storeId}）` : ''}` : m.deliveryAddress
  return store ? `${label} — ${store}` : label
}

// 教材訂單內嵌資訊（取代原「查看」對話框）
function MaterialOrderInfo({ order }: { order: CourseSessionOrder }) {
  const t = useTranslations('course.material')
  const versionLabels = {
    trad: t('versionShortTraditional'),
    simp: t('versionShortSimplified'),
    eng: t('versionShortEnglish'),
  }
  const deliveryLabels = {
    sevenEleven: t('deliverySevenEleven'),
    familyMart: t('deliveryFamilyMart'),
    delivery: t('deliveryDelivery'),
  }
  const versionShort = (v: string) =>
    v === 'traditional' ? versionLabels.trad : v === 'simplified' ? versionLabels.simp : versionLabels.eng
  const fmt = (d: Date | null) => (d ? new Date(d).toLocaleString('zh-TW') : null)
  if (order.shipMode === 'multiple') {
    return (
      <div className="space-y-2 text-sm text-muted-foreground">
        {order.shipments.map((s, i) => (
          <div key={s.id} className="rounded border px-3 py-2 space-y-0.5">
            <p className="font-medium text-foreground">
              {t('addressNumberLabel', { n: i + 1 })}
              <span className="ml-2 text-xs">{bookLabel(s.traditionalQty, s.simplifiedQty, s.englishQty, versionLabels)}</span>
            </p>
            <p>{t('deliveryMethodPrefix')}{deliveryLine(s, deliveryLabels)}</p>
            <p>{t('recipientPrefix')}{s.recipientName || '—'}　·　{s.recipientPhone || '—'}</p>
            {s.items.length > 0 && (
              <ul className="space-y-0.5">
                {s.items.map((it, j) => (
                  <li key={j}>・{it.studentName}（{it.bookName}）· {versionShort(it.version)}</li>
                ))}
              </ul>
            )}
            {fmt(s.shippedAt) && <p>{t('shippedAtPrefix')}{fmt(s.shippedAt)}</p>}
          </div>
        ))}
        {fmt(order.receivedAt) && <p>{t('receivedAtPrefix')}{fmt(order.receivedAt)}</p>}
      </div>
    )
  }
  return (
    <div className="space-y-0.5 text-sm text-muted-foreground">
      <p>{t('bookQtyPrefix')}{bookLabel(order.traditionalQty, order.simplifiedQty, order.englishQty, versionLabels)}</p>
      <p>{t('deliveryMethodPrefix')}{deliveryLine(order, deliveryLabels)}</p>
      <p>{t('recipientPrefix')}{order.recipientName || '—'}　·　{order.recipientPhone || '—'}</p>
      {fmt(order.shippedAt) && <p>{t('shippedAtPrefix')}{fmt(order.shippedAt)}</p>}
      {fmt(order.receivedAt) && <p>{t('receivedAtPrefix')}{fmt(order.receivedAt)}</p>}
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
  isInstructor,
  canManageMaterials,
  isCancelled,
  isCompleted,
  isStarted,
  hasApprovedStudents,
  approvedCount,
  orders,
  progress,
  materialFinalizedAt,
  canStart,
  startReasons,
  defaultRecipient,
  bookItems,
}: Props) {
  const router = useRouter()
  const t = useTranslations('course.material')
  const ta = useTranslations('course.actions')
  const versionLabels = {
    trad: t('versionShortTraditional'),
    simp: t('versionShortSimplified'),
    eng: t('versionShortEnglish'),
  }
  const [cancelOpen, setCancelOpen] = useState(false)
  // 教材申請 Dialog：僅用於「申請教材」（新訂單）；既有訂單改於列內嵌顯示
  const [materialOpen, setMaterialOpen] = useState(false)
  // 完成教材申請：確認視窗與處理中狀態
  const [finalizeOpen, setFinalizeOpen] = useState(false)
  const [finalizePending, startFinalizeTransition] = useTransition()
  const [startLoading, setStartLoading] = useState(false)
  // 開始上課：所選開課日期（預設今天）與確認視窗
  const [startDate, setStartDate] = useState(todayInput())
  const [startConfirmOpen, setStartConfirmOpen] = useState(false)
  // 重新招募：確認視窗與處理中狀態
  const [reopenOpen, setReopenOpen] = useState(false)
  const [reopenLoading, setReopenLoading] = useState(false)
  // 結業回退：確認視窗與處理中狀態
  const [revertOpen, setRevertOpen] = useState(false)
  const [revertLoading, setRevertLoading] = useState(false)
  const [receiptPending, startReceiptTransition] = useTransition()
  const [paymentPending, startPaymentTransition] = useTransition()
  const [cancelPending, startCancelTransition] = useTransition()
  const [last5Map, setLast5Map] = useState<Record<number, string>>({})

  const canAct = !isCancelled && !isCompleted

  function openNewOrder() {
    setMaterialOpen(true)
  }

  function handleCancelOrder(orderId: number) {
    if (!window.confirm(t('cancelOrderConfirm'))) return
    startCancelTransition(async () => {
      const result = await cancelCourseOrder(orderId)
      if (result.success) {
        toast.success(result.message ?? t('cancelledSuccessFallback'))
        router.refresh()
      } else {
        toast.error(result.message ?? t('cancelFailFallback'))
      }
    })
  }

  function handleReportPayment(orderId: number) {
    startPaymentTransition(async () => {
      const result = await reportMaterialPayment(orderId, last5Map[orderId] ?? '')
      if (result.success) {
        toast.success(result.message ?? t('paymentReportedFallback'))
        setLast5Map((m) => ({ ...m, [orderId]: '' }))
        router.refresh()
      } else {
        toast.error(result.errors?.last5?.[0] ?? result.message ?? t('genericFailFallback'))
      }
    })
  }

  function handleConfirmReceipt(orderId: number) {
    startReceiptTransition(async () => {
      const result = await confirmReceipt(orderId)
      if (result.success) {
        toast.success(result.message ?? t('receiptConfirmedFallback'))
        router.refresh()
      } else {
        toast.error(result.message ?? t('genericFailFallback'))
      }
    })
  }

  async function handleReopen() {
    setReopenLoading(true)
    const result = await reopenRecruitment(inviteId)
    setReopenLoading(false)
    setReopenOpen(false)
    if (result.success) {
      toast.success(result.message ?? ta('reopenSuccessFallback'))
      router.refresh()
    } else {
      toast.error(result.message ?? t('genericFailFallback'))
    }
  }

  async function handleRevert() {
    setRevertLoading(true)
    const result = await revertGraduation(inviteId)
    setRevertLoading(false)
    setRevertOpen(false)
    if (result.success) {
      toast.success(result.message ?? ta('revertSuccessFallback'))
      router.refresh()
    } else {
      toast.error(result.message ?? t('genericFailFallback'))
    }
  }

  function handleFinalize() {
    startFinalizeTransition(async () => {
      const result = await finalizeMaterialOrders(inviteId)
      setFinalizeOpen(false)
      if (result.success) {
        toast.success(result.message ?? t('finalizeDone'))
        router.refresh()
      } else {
        toast.error(result.message ?? t('genericFailFallback'))
      }
    })
  }

  function handleReopenMaterial() {
    startFinalizeTransition(async () => {
      const result = await reopenMaterialOrders(inviteId)
      if (result.success) {
        toast.success(result.message ?? t('reopenDone'))
        router.refresh()
      } else {
        toast.error(result.message ?? t('genericFailFallback'))
      }
    })
  }

  async function handleStart() {
    setStartLoading(true)
    const result = await startCourseSession(inviteId, startDate)
    setStartLoading(false)
    setStartConfirmOpen(false)
    if (result.success) {
      toast.success(ta('startSuccessToast'))
      router.refresh()
    } else {
      toast.error(result.message ?? t('genericFailFallback'))
    }
  }

  // 已取消：不顯示任何作業區塊；已結業：仍需顯示「結業回退作業」，其餘區塊各自以 isCompleted 排除
  if (isCancelled) return null

  const { total, applied, remaining, canApplyMore } = progress
  const isFinalized = materialFinalizedAt != null
  // 進行中（尚未收件）的教材訂單存在時，不可標記「已完成申請」
  const hasActiveOrders = orders.some((o) => o.receivedAt == null)

  return (
    <div className="space-y-3">
      {/* ── 區塊一：教材申請作業（講師與管理者） ────────────────── */}
      {!isStarted && canManageMaterials && (
        <Section title={ta('sectionMaterial')} icon={<IconBook className="h-5 w-5 text-primary" />}>
          {/* ── 單元一：學員教材需求統計 ── */}
          <div className="space-y-1.5">
            <h4 className="text-sm font-semibold">{t('sectionDemand')}</h4>
            <div className="rounded-md bg-muted/50 px-3 py-2 text-sm space-y-1">
              <div className="flex justify-between gap-2">
                <span className="text-muted-foreground">{t('totalDemandLabel')}</span>
                <span>{bookLabel(total.traditional, total.simplified, total.english, versionLabels)}</span>
              </div>
              <p className="text-xs text-muted-foreground">{t('progressRefHint')}</p>
            </div>
          </div>

          {/* ── 單元二：教材申請進度 ── */}
          <div className="space-y-1.5">
            <h4 className="text-sm font-semibold">{t('sectionProgress')}</h4>
            <div className="rounded-md bg-muted/50 px-3 py-2 text-sm space-y-1">
              <div className="flex justify-between gap-2">
                <span className="text-muted-foreground">{t('appliedLabel')}</span>
                <span>{bookLabel(applied.traditional, applied.simplified, applied.english, versionLabels)}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-muted-foreground">{t('remainingLabel')}</span>
                <span className={cn(canApplyMore && 'font-medium text-amber-700')}>
                  {bookLabel(remaining.traditional, remaining.simplified, remaining.english, versionLabels)}
                </span>
              </div>
            </div>

            {/* 訂單清單（每筆顯示書籍種類與數量＋狀態＋動作） */}
            {orders.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('noOrdersHint')}</p>
            ) : (
            <ul className="space-y-2">
              {orders.map((order) => {
                const status = getMaterialOrderStatus(order)
                return (
                  <li key={order.id} className="rounded-md border p-3 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium">
                        {t('orderNumberLabel', { id: order.id })}
                        <span className="ml-2 text-xs text-muted-foreground">
                          {bookLabel(order.traditionalQty, order.simplifiedQty, order.englishQty, versionLabels)}
                        </span>
                      </span>
                      <span className={cn('rounded px-2 py-0.5 text-xs', status.tone)}>{status.label}</span>
                    </div>

                    {/* 內嵌顯示訂單寄送資訊 */}
                    <MaterialOrderInfo order={order} />

                    {status.key === 'pending_payment' && (
                      <div className="text-sm bg-amber-50 border border-amber-200 rounded-md px-3 py-2 space-y-2">
                        <p className="text-amber-800">
                          {t('feeNoticePrefix')} <strong>NT${order.quotedAmount}</strong>{t('feeNoticeSuffix')}
                        </p>
                        <p className="whitespace-pre-wrap font-medium text-amber-900">
                          {order.remittanceAccount}
                        </p>
                        <div className="flex items-center gap-2">
                          <Input
                            value={last5Map[order.id] ?? ''}
                            onChange={(e) => setLast5Map((m) => ({ ...m, [order.id]: e.target.value }))}
                            placeholder={t('last5Placeholder')}
                            maxLength={5}
                            className="w-32"
                          />
                          <Button size="sm" onClick={() => handleReportPayment(order.id)} disabled={paymentPending}>
                            {paymentPending ? t('submittingLabel') : t('fillButton')}
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
                          {cancelPending ? t('cancellingLabel') : t('cancelOrderButton')}
                        </Button>
                      )}
                      {status.key === 'shipped' && (
                        <Button size="sm" onClick={() => handleConfirmReceipt(order.id)} disabled={receiptPending}>
                          {receiptPending ? t('confirmingLabel') : t('receivedButton')}
                        </Button>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
            )}
          </div>

          {/* ── 單元三：申請作業（注意事項＋功能按鈕說明＋功能按鈕／完成狀態） ── */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">{t('sectionApply')}</h4>

            {isFinalized ? (
              /* 已完成申請：僅顯示完成狀態＋重新開放（注意事項與按鈕不顯示） */
              <div className="flex items-center justify-between gap-2 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm">
                <span className="flex items-center gap-1.5 text-green-800">
                  <IconChecks className="h-4 w-4" />
                  {t('finalizeDone')}
                </span>
                <Button variant="outline" size="sm" onClick={handleReopenMaterial} disabled={finalizePending}>
                  {finalizePending ? t('processing') : t('reopenButton')}
                </Button>
              </div>
            ) : (
              <>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p className="font-medium text-foreground">{t('applyNotesTitle')}</p>
                  <ul className="list-disc pl-5 space-y-0.5">
                    <li>{t('noteApplyButton')}</li>
                    <li>{t('noteFinalizeButton')}</li>
                    <li>{t('noteFinalizeBlocked')}</li>
                    {total.traditional + total.simplified + total.english === 0 && <li>{t('noDemandHint')}</li>}
                  </ul>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Button variant="outline" size="sm" onClick={openNewOrder}>
                    {t('applyMaterialButton')}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setFinalizeOpen(true)}
                    disabled={hasActiveOrders || finalizePending}
                  >
                    {t('finalizeButton')}
                  </Button>
                </div>
                {!canApplyMore && total.traditional + total.simplified + total.english > 0 && (
                  <p className="text-xs text-muted-foreground">{t('allAppliedHint')}</p>
                )}
              </>
            )}
          </div>

          {/* 完成教材申請確認視窗 */}
          <Dialog open={finalizeOpen} onOpenChange={setFinalizeOpen}>
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle>{t('finalizeConfirmTitle')}</DialogTitle>
              </DialogHeader>
              <div className="space-y-2 text-sm">
                <p>
                  {t('finalizeConfirmRemaining', {
                    trad: remaining.traditional,
                    simp: remaining.simplified,
                    eng: remaining.english,
                  })}
                </p>
                <p className="text-muted-foreground">{t('finalizeConfirmDesc')}</p>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setFinalizeOpen(false)} disabled={finalizePending}>
                  {t('cancel')}
                </Button>
                <Button onClick={handleFinalize} disabled={finalizePending}>
                  {finalizePending ? t('processing') : t('finalizeConfirmAction')}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </Section>
      )}

      {/* ── 區塊二：開始上課作業（僅講師） ────────────────── */}
      {!isStarted && isInstructor && (
        <Section title={ta('sectionStart')} icon={<IconPlayerPlay className="h-5 w-5 text-primary" />}>
          <div className="text-sm text-muted-foreground space-y-1">
            <p>{ta('startNote')}</p>
            <p>{t('startGateHint')}</p>
            {!canStart && startReasons.length > 0 && (
              <ul className="list-disc pl-5 text-amber-700">
                {startReasons.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            )}
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium" htmlFor="course-start-date">{ta('startDateLabel')}</label>
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
                toast.error(ta('startSelectDateError'))
                return
              }
              setStartConfirmOpen(true)
            }}
            disabled={startLoading || !canStart}
          >
            {ta('startButton')}
          </Button>

          {/* 開始上課確認視窗：確認開課日期與人數後才執行 */}
          <Dialog open={startConfirmOpen} onOpenChange={setStartConfirmOpen}>
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle>{ta('startConfirmTitle')}</DialogTitle>
              </DialogHeader>
              <div className="space-y-2 text-sm">
                <p>
                  {ta('startConfirmDate')}<span className="font-medium">{startDate.replace(/-/g, '/')}</span>
                </p>
                <p>
                  {ta('startConfirmCount', { count: approvedCount })}
                </p>
                <p className="text-muted-foreground">{ta('startConfirmDesc')}</p>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setStartConfirmOpen(false)} disabled={startLoading}>
                  {ta('cancel')}
                </Button>
                <Button onClick={handleStart} disabled={startLoading}>
                  {startLoading ? ta('processing') : ta('confirmStart')}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </Section>
      )}

      {/* 進行中：結業作業（講師與管理者） */}
      {isStarted && !isCompleted && (
        <Section title={ta('sectionGraduate')} icon={<IconCertificate className="h-5 w-5 text-primary" />}>
          {hasApprovedStudents ? (
            <Button asChild>
              <Link href={`/course/${inviteId}/graduate`}>{ta('graduateButton')}</Link>
            </Button>
          ) : (
            <Button onClick={() => toast.error(ta('graduateNoStudentsToast'))}>
              {ta('graduateButton')}
            </Button>
          )}
        </Section>
      )}

      {/* 進行中：重新招募作業（講師與管理者） */}
      {isStarted && !isCompleted && (
        <Section title={ta('sectionReopen')} icon={<IconRefresh className="h-5 w-5 text-primary" />}>
          <p className="text-sm text-muted-foreground">
            {ta('reopenDesc')}
          </p>
          <Button variant="outline" onClick={() => setReopenOpen(true)}>
            {ta('reopenButton')}
          </Button>

          {/* 重新招募確認視窗 */}
          <Dialog open={reopenOpen} onOpenChange={setReopenOpen}>
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle>{ta('reopenConfirmTitle')}</DialogTitle>
              </DialogHeader>
              <div className="space-y-2 text-sm">
                <p>{ta('reopenConfirmLine1')}</p>
                <p className="text-muted-foreground">
                  {ta('reopenConfirmLine2')}
                </p>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setReopenOpen(false)} disabled={reopenLoading}>
                  {ta('cancel')}
                </Button>
                <Button onClick={handleReopen} disabled={reopenLoading}>
                  {reopenLoading ? ta('processing') : ta('confirmReopen')}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </Section>
      )}

      {/* 已結業：結業回退作業（講師與管理者） */}
      {isCompleted && (
        <Section title={ta('sectionRevert')} icon={<IconRefresh className="h-5 w-5 text-primary" />}>
          <p className="text-sm text-muted-foreground">
            {ta('revertDesc')}
          </p>
          <Button variant="outline" onClick={() => setRevertOpen(true)}>
            {ta('revertButton')}
          </Button>

          {/* 結業回退確認視窗 */}
          <Dialog open={revertOpen} onOpenChange={setRevertOpen}>
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle>{ta('revertConfirmTitle')}</DialogTitle>
              </DialogHeader>
              <div className="space-y-2 text-sm">
                <p>{ta('revertConfirmLine1')}</p>
                <p className="text-muted-foreground">
                  {ta('revertConfirmLine2')}
                </p>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setRevertOpen(false)} disabled={revertLoading}>
                  {ta('cancel')}
                </Button>
                <Button onClick={handleRevert} disabled={revertLoading}>
                  {revertLoading ? ta('processing') : ta('confirmReopen')}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </Section>
      )}

      {/* ── 區塊三：取消上課作業（講師與管理者，已結業課程不顯示，原經上方 return null 排除） ────────────────── */}
      {!isCompleted && (
        <Section title={ta('sectionCancel')} icon={<IconBan className="h-5 w-5 text-primary" />}>
          <Button variant="destructive" onClick={() => setCancelOpen(true)}>
            {ta('cancelButton')}
          </Button>
        </Section>
      )}

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
