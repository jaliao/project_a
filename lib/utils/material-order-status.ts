/*
 * ----------------------------------------------
 * 教材訂單狀態推導（金流＋寄送）
 * 2026-06-21
 * lib/utils/material-order-status.ts
 *
 * 依 nullable 時間戳推導單一真相狀態，供管理頁與課程頁共用。
 * ----------------------------------------------
 */

export type MaterialOrderStatusKey =
  | 'pending_quote' // 待批價
  | 'pending_payment' // 待付款
  | 'pending_confirm' // 待確認收款
  | 'pending_ship' // 待寄送
  | 'shipped' // 已寄送
  | 'received' // 已收件

export type MaterialOrderStatusInput = {
  quotedAt: Date | null
  paymentReportedAt: Date | null
  paymentConfirmedAt: Date | null
  shippedAt: Date | null
  receivedAt: Date | null
}

const LABELS: Record<MaterialOrderStatusKey, string> = {
  pending_quote: '待批價',
  pending_payment: '待付款',
  pending_confirm: '待確認收款',
  pending_ship: '待寄送',
  shipped: '已寄送',
  received: '已收件',
}

// badge 色調（對應 tailwind 既有用色）
const TONES: Record<MaterialOrderStatusKey, string> = {
  pending_quote: 'bg-gray-100 text-gray-700',
  pending_payment: 'bg-amber-100 text-amber-700',
  pending_confirm: 'bg-orange-100 text-orange-700',
  pending_ship: 'bg-amber-100 text-amber-700',
  shipped: 'bg-blue-100 text-blue-700',
  received: 'bg-green-100 text-green-700',
}

export function getMaterialOrderStatusKey(o: MaterialOrderStatusInput): MaterialOrderStatusKey {
  if (!o.quotedAt) return 'pending_quote'
  if (!o.paymentReportedAt) return 'pending_payment'
  if (!o.paymentConfirmedAt) return 'pending_confirm'
  if (!o.shippedAt) return 'pending_ship'
  if (!o.receivedAt) return 'shipped'
  return 'received'
}

export function getMaterialOrderStatus(o: MaterialOrderStatusInput): {
  key: MaterialOrderStatusKey
  label: string
  tone: string
} {
  const key = getMaterialOrderStatusKey(o)
  return { key, label: LABELS[key], tone: TONES[key] }
}
