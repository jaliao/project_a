/*
 * ----------------------------------------------
 * MaterialOrderTable - 後台教材申請管理表格
 * 2026-03-30
 * components/admin/material-order-table.tsx
 * ----------------------------------------------
 */

'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { IconChevronDown, IconChevronRight, IconPrinter } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { confirmShipment } from '@/app/actions/course-order'
import type { CourseOrderWithInvite } from '@/lib/data/course-order'

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

// ── 狀態標籤元件 ──────────────────────────
function ShipmentStatusBadge({
  shippedAt,
  receivedAt,
}: {
  shippedAt: Date | null
  receivedAt: Date | null
}) {
  if (receivedAt) {
    return (
      <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
        已收件
      </span>
    )
  }
  if (shippedAt) {
    return (
      <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">
        已寄送
      </span>
    )
  }
  return (
    <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">
      待寄送
    </span>
  )
}

// ── 詳情展開列 ───────────────────────────
function OrderDetail({ order }: { order: CourseOrderWithInvite }) {
  return (
    <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm p-4 bg-muted/30 border-t">
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
        <span className="text-muted-foreground">聯絡電話：</span>
        {order.phone}
      </div>
      <div>
        <span className="text-muted-foreground">Email：</span>
        {order.email}
      </div>
      <div>
        <span className="text-muted-foreground">購買性質：</span>
        {PURCHASE_TYPE_LABELS[order.purchaseType] ?? order.purchaseType}
      </div>
      {order.studentNames && (
        <div className="col-span-2">
          <span className="text-muted-foreground">學員代購姓名：</span>
          {order.studentNames}
        </div>
      )}
      <div>
        <span className="text-muted-foreground">取貨方式：</span>
        {DELIVERY_METHOD_LABELS[order.deliveryMethod] ?? order.deliveryMethod}
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
      {order.quantityNote && (
        <div>
          <span className="text-muted-foreground">數量備註：</span>
          {order.quantityNote}
        </div>
      )}
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
  )
}

// ── 主元件 ────────────────────────────────
interface MaterialOrderTableProps {
  orders: CourseOrderWithInvite[]
}

export function MaterialOrderTable({ orders }: MaterialOrderTableProps) {
  const router = useRouter()
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [pending, startTransition] = useTransition()
  const [loadingId, setLoadingId] = useState<number | null>(null)

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
                  <ShipmentStatusBadge
                    shippedAt={order.shippedAt}
                    receivedAt={order.receivedAt}
                  />
                </td>
                <td
                  className="px-4 py-3"
                  onClick={(e) => e.stopPropagation()}
                >
                  {!order.shippedAt && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={pending && loadingId === order.id}
                      onClick={() => handleConfirmShipment(order.id)}
                    >
                      {pending && loadingId === order.id
                        ? '處理中...'
                        : '確認已寄送'}
                    </Button>
                  )}
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
                    <OrderDetail order={order} />
                  </td>
                </tr>
              )}
            </>
          ))}
        </tbody>
      </table>
    </div>
  )
}
