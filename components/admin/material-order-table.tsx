/*
 * ----------------------------------------------
 * MaterialOrderTable - 後台教材申請管理表格
 * 2026-03-30 (Updated: 2026-04-02)
 * components/admin/material-order-table.tsx
 * ----------------------------------------------
 */

'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { IconChevronDown, IconChevronRight, IconPrinter, IconEdit } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { confirmShipment, confirmShipmentBatch, confirmMaterialPayment } from '@/app/actions/course-order'
import type { CourseOrderWithInvite } from '@/lib/data/course-order'
import { getMaterialOrderStatus, getMaterialOrderStatusKey } from '@/lib/utils/material-order-status'
import { MaterialOrderEditDialog } from './material-order-edit-dialog'
import { MaterialQuoteDialog } from './material-quote-dialog'

// ── 教材版本標籤 ──────────────────────────
const MATERIAL_VERSION_LABELS: Record<string, string> = {
  traditional: '繁體版',
  simplified: '簡體版',
  both: '繁體＋簡體',
}

// ── 購買性質標籤 ──────────────────────────
const PURCHASE_TYPE_LABELS: Record<string, string> = {
  selfOnly: '種子教師自用',
  selfAndProxy: '自用＋代購',
  proxyOnly: '只幫學員代購',
}

// ── 取貨方式標籤 ──────────────────────────
const DELIVERY_METHOD_LABELS: Record<string, string> = {
  sevenEleven: '7-11 取貨',
  familyMart: '全家取貨',
  delivery: '郵寄/宅配',
}

// 狀態標籤已改由 lib/utils/material-order-status.ts 的 getMaterialOrderStatus 推導

// ── 詳情展開列 ───────────────────────────
function OrderDetail({
  order,
  onEditClick,
  onConfirmBatch,
  busyShipmentId,
  pending,
}: {
  order: CourseOrderWithInvite
  onEditClick: () => void
  onConfirmBatch: (shipmentId: number) => void
  busyShipmentId: number | null
  pending: boolean
}) {
  return (
    <div className="p-4 bg-muted/30 border-t space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">購買人資料（自動快照）</p>
        <Button size="sm" variant="outline" onClick={onEditClick} className="h-7 gap-1">
          <IconEdit className="h-3.5 w-3.5" />
          編輯
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
        <div>
          <span className="text-muted-foreground">購買人中文姓名：</span>
          {order.buyerNameZh}
        </div>
        <div>
          <span className="text-muted-foreground">購買人英文姓名：</span>
          {order.buyerNameEn}
        </div>
        <div>
          <span className="text-muted-foreground">教師姓名：</span>
          {order.teacherName}
        </div>
        <div>
          <span className="text-muted-foreground">所屬教會/單位：</span>
          {order.churchOrg}
        </div>
        <div>
          <span className="text-muted-foreground">Email：</span>
          {order.email}
        </div>
        <div>
          <span className="text-muted-foreground">聯絡電話：</span>
          {order.phone}
        </div>
        <div>
          <span className="text-muted-foreground">預計開課日期：</span>
          {order.courseDate}
        </div>
        {order.taxId && (
          <div>
            <span className="text-muted-foreground">統一編號：</span>
            {order.taxId}
          </div>
        )}
      </div>
      {order.quotedAt && (
        <div className="pt-2 border-t grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
          <div>
            <span className="text-muted-foreground">批價金額：</span>
            NT${order.quotedAmount}
          </div>
          <div>
            <span className="text-muted-foreground">匯款帳號：</span>
            {order.remittanceAccount ?? '—'}
          </div>
          {order.paymentLast5 && (
            <div>
              <span className="text-muted-foreground">匯款後五碼：</span>
              {order.paymentLast5}
            </div>
          )}
          {order.paymentReportedAt && (
            <div>
              <span className="text-muted-foreground">回填時間：</span>
              {order.paymentReportedAt.toLocaleString('zh-TW')}
            </div>
          )}
          {order.paymentConfirmedAt && (
            <div>
              <span className="text-muted-foreground">確認收款：</span>
              {order.paymentConfirmedAt.toLocaleString('zh-TW')}
            </div>
          )}
        </div>
      )}
      {order.shipMode === 'multiple' ? (
        /* 多地址：逐批次列出與確認 */
        <div className="pt-2 border-t space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            多地址寄送（{order.shipments.filter((s) => s.shippedAt).length}/{order.shipments.length} 已寄送）
          </p>
          {order.shipments.map((s, i) => {
            const addr =
              s.deliveryMethod === 'delivery'
                ? s.deliveryAddress || '（未填地址）'
                : s.storeName && s.storeId
                  ? `${s.storeName}（${s.storeId}）`
                  : '（未選門市）'
            return (
              <div key={s.id} className="flex items-center justify-between gap-3 rounded-md border bg-background px-3 py-2">
                <div className="text-sm">
                  <span className="font-medium">地址 {i + 1}：</span>
                  <span className="text-muted-foreground">{DELIVERY_METHOD_LABELS[s.deliveryMethod] ?? s.deliveryMethod} — {addr}</span>
                  <span className="ml-2 text-xs text-muted-foreground">繁 {s.traditionalQty} / 簡 {s.simplifiedQty}</span>
                </div>
                {s.shippedAt ? (
                  <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700 shrink-0">已寄送</span>
                ) : order.paymentConfirmedAt ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 shrink-0"
                    disabled={pending && busyShipmentId === s.id}
                    onClick={() => onConfirmBatch(s.id)}
                  >
                    {pending && busyShipmentId === s.id ? '處理中...' : '確認已寄送'}
                  </Button>
                ) : (
                  <span className="text-xs text-muted-foreground shrink-0">待確認收款</span>
                )}
              </div>
            )
          })}
          {order.receivedAt && (
            <div className="text-sm">
              <span className="text-muted-foreground">收件時間：</span>
              {order.receivedAt.toLocaleString('zh-TW')}
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm pt-2 border-t">
          <div>
            <span className="text-muted-foreground">書本數量：</span>
            繁 {order.traditionalQty} / 簡 {order.simplifiedQty}
          </div>
          <div>
            <span className="text-muted-foreground">取貨方式：</span>
            {DELIVERY_METHOD_LABELS[order.deliveryMethod] ?? order.deliveryMethod}
            {order.deliveryMethod === 'sevenEleven' && (
              <span className="ml-1 text-muted-foreground">
                {order.storeName && order.storeId
                  ? `— ${order.storeName}（${order.storeId}）`
                  : order.deliveryAddress ? `— ${order.deliveryAddress}` : ''}
              </span>
            )}
            {order.deliveryMethod !== 'sevenEleven' && order.deliveryAddress && (
              <span className="ml-1 text-muted-foreground">— {order.deliveryAddress}</span>
            )}
          </div>
          {order.shippedAt && (
            <div>
              <span className="text-muted-foreground">寄送時間：</span>
              {order.shippedAt.toLocaleString('zh-TW')}
            </div>
          )}
          {order.receivedAt && (
            <div>
              <span className="text-muted-foreground">收件時間：</span>
              {order.receivedAt.toLocaleString('zh-TW')}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── 主元件 ────────────────────────────────
interface MaterialOrderTableProps {
  orders: CourseOrderWithInvite[]
  defaultRemittanceAccount: string
}

export function MaterialOrderTable({ orders, defaultRemittanceAccount }: MaterialOrderTableProps) {
  const router = useRouter()
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [editOrderId, setEditOrderId] = useState<number | null>(null)
  const [quoteOrderId, setQuoteOrderId] = useState<number | null>(null)
  const [pending, startTransition] = useTransition()
  const [loadingId, setLoadingId] = useState<number | null>(null)
  const [busyShipmentId, setBusyShipmentId] = useState<number | null>(null)

  const editingOrder = editOrderId !== null ? orders.find((o) => o.id === editOrderId) ?? null : null

  function handleConfirmPayment(orderId: number) {
    setLoadingId(orderId)
    startTransition(async () => {
      const result = await confirmMaterialPayment(orderId)
      setLoadingId(null)
      if (result.success) {
        toast.success(result.message ?? '已確認收款')
        router.refresh()
      } else {
        toast.error(result.message ?? '操作失敗，請稍後再試')
      }
    })
  }

  function handleConfirmShipment(orderId: number) {
    setLoadingId(orderId)
    startTransition(async () => {
      const result = await confirmShipment(orderId)
      setLoadingId(null)
      if (result.success) {
        toast.success(result.message ?? '已標記為已寄送')
        router.refresh()
      } else {
        toast.error(result.message ?? '操作失敗，請稍後再試')
      }
    })
  }

  function handleConfirmBatch(shipmentId: number) {
    setBusyShipmentId(shipmentId)
    startTransition(async () => {
      const result = await confirmShipmentBatch(shipmentId)
      setBusyShipmentId(null)
      if (result.success) {
        toast.success(result.message ?? '已標記此批次為已寄送')
        router.refresh()
      } else {
        toast.error(result.message ?? '操作失敗，請稍後再試')
      }
    })
  }

  if (orders.length === 0) {
    return (
      <div className="rounded-lg border p-12 text-center text-sm text-muted-foreground">
        目前尚無教材申請
      </div>
    )
  }

  return (
    <div className="rounded-lg border overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50 text-left text-xs text-muted-foreground">
            <th className="px-4 py-3 w-8"></th>
            <th className="px-4 py-3">編號</th>
            <th className="px-4 py-3">課程名稱</th>
            <th className="px-4 py-3">講師</th>
            <th className="px-4 py-3">購買人</th>
            <th className="px-4 py-3">教材版本</th>
            <th className="px-4 py-3">數量</th>
            <th className="px-4 py-3">申請時間</th>
            <th className="px-4 py-3">狀態</th>
            <th className="px-4 py-3">操作</th>
            <th className="px-4 py-3">出貨單</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <>
              <tr
                key={order.id}
                className="border-b hover:bg-muted/30 cursor-pointer"
                onClick={() =>
                  setExpandedId(expandedId === order.id ? null : order.id)
                }
              >
                {/* 展開箭頭 */}
                <td className="px-4 py-3 text-muted-foreground">
                  {expandedId === order.id ? (
                    <IconChevronDown className="h-4 w-4" />
                  ) : (
                    <IconChevronRight className="h-4 w-4" />
                  )}
                </td>
                <td className="px-4 py-3 font-medium">#{order.id}</td>
                <td className="px-4 py-3">{order.inviteTitle ?? '—'}</td>
                <td className="px-4 py-3">
                  <div>{order.instructorName ?? '—'}</div>
                  {order.instructorEmail && (
                    <div className="text-xs text-muted-foreground">
                      {order.instructorEmail}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3">{order.buyerNameZh}</td>
                <td className="px-4 py-3">
                  {MATERIAL_VERSION_LABELS[order.materialVersion] ??
                    order.materialVersion}
                </td>
                <td className="px-4 py-3">
                  {order.quantity > 0 ? `${order.quantity} 本` : order.quantityNote ?? '—'}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {order.createdAt.toLocaleDateString('zh-TW')}
                </td>
                <td className="px-4 py-3">
                  {order.shipMode === 'multiple' && order.paymentConfirmedAt && !order.shippedAt && !order.receivedAt && order.shipments.some((s) => s.shippedAt) ? (
                    <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-700">
                      部分已寄送（{order.shipments.filter((s) => s.shippedAt).length}/{order.shipments.length}）
                    </span>
                  ) : (
                    (() => {
                      const st = getMaterialOrderStatus(order)
                      return (
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${st.tone}`}>
                          {st.label}
                        </span>
                      )
                    })()
                  )}
                </td>
                <td
                  className="px-4 py-3"
                  onClick={(e) => e.stopPropagation()}
                >
                  {(() => {
                    const key = getMaterialOrderStatusKey(order)
                    const busy = pending && loadingId === order.id
                    if (key === 'pending_quote') {
                      return (
                        <Button size="sm" variant="outline" onClick={() => setQuoteOrderId(order.id)}>
                          批價
                        </Button>
                      )
                    }
                    if (key === 'pending_payment') {
                      return <span className="text-xs text-muted-foreground">等待老師付款</span>
                    }
                    if (key === 'pending_confirm') {
                      return (
                        <Button size="sm" variant="outline" disabled={busy} onClick={() => handleConfirmPayment(order.id)}>
                          {busy ? '處理中...' : '確認收款'}
                        </Button>
                      )
                    }
                    if (key === 'pending_ship') {
                      return order.shipMode === 'multiple' ? (
                        <span className="text-xs text-muted-foreground">展開逐批確認</span>
                      ) : (
                        <Button size="sm" variant="outline" disabled={busy} onClick={() => handleConfirmShipment(order.id)}>
                          {busy ? '處理中...' : '確認已寄送'}
                        </Button>
                      )
                    }
                    return null
                  })()}
                </td>
                <td
                  className="px-4 py-3"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Button
                    size="sm"
                    variant="ghost"
                    asChild
                  >
                    <a
                      href={`/admin/materials/${order.id}/print`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1"
                    >
                      <IconPrinter className="h-4 w-4" />
                      列印
                    </a>
                  </Button>
                </td>
              </tr>
              {/* 展開詳情列 */}
              {expandedId === order.id && (
                <tr key={`detail-${order.id}`}>
                  <td colSpan={11} className="p-0">
                    <OrderDetail
                      order={order}
                      onEditClick={() => setEditOrderId(order.id)}
                      onConfirmBatch={handleConfirmBatch}
                      busyShipmentId={busyShipmentId}
                      pending={pending}
                    />
                  </td>
                </tr>
              )}
            </>
          ))}
        </tbody>
      </table>

      {editingOrder && (
        <MaterialOrderEditDialog
          open={editOrderId !== null}
          onOpenChange={(open) => { if (!open) setEditOrderId(null) }}
          orderId={editingOrder.id}
          defaultValues={{
            buyerNameZh: editingOrder.buyerNameZh,
            buyerNameEn: editingOrder.buyerNameEn,
            teacherName: editingOrder.teacherName,
            churchOrg: editingOrder.churchOrg,
            email: editingOrder.email,
            phone: editingOrder.phone,
            courseDate: editingOrder.courseDate,
            taxId: editingOrder.taxId,
          }}
        />
      )}

      {quoteOrderId !== null && (
        <MaterialQuoteDialog
          open={quoteOrderId !== null}
          onOpenChange={(open) => { if (!open) setQuoteOrderId(null) }}
          orderId={quoteOrderId}
          defaultAccount={defaultRemittanceAccount}
        />
      )}
    </div>
  )
}
