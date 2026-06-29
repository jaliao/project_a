/*
 * ----------------------------------------------
 * 出貨單列印頁面
 * 2026-03-30
 * app/(user)/admin/materials/[id]/print/page.tsx
 * ----------------------------------------------
 */

import { notFound } from 'next/navigation'
import { getCourseOrderForPrint } from '@/lib/data/course-order'
import { PrintButton } from './print-button'

const DELIVERY_METHOD_LABELS: Record<string, string> = {
  sevenEleven: '7-11 取貨',
  familyMart: '全家取貨',
  delivery: '郵寄 / 宅配',
}

export default async function PrintShippingOrderPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  // 守衛（登入 + admin 身分）由 (admin)/layout.tsx 統一處理
  const orderId = parseInt(id, 10)
  if (isNaN(orderId)) notFound()

  const order = await getCourseOrderForPrint(orderId)
  if (!order) notFound()

  // 組出待列印的出貨單清單：多地址 → 每批次一份；單一 → 一份
  const slips =
    order.shipMode === 'multiple' && order.shipments.length > 0
      ? order.shipments.map((s, i) => ({
          key: `s-${s.id}`,
          label: `（地址 ${i + 1} / ${order.shipments.length}）`,
          recipientName: s.recipientName,
          recipientPhone: s.recipientPhone,
          deliveryMethod: s.deliveryMethod,
          storeName: s.storeName,
          storeId: s.storeId,
          deliveryAddress: s.deliveryAddress,
          traditional: s.traditionalQty,
          simplified: s.simplifiedQty,
        }))
      : [
          {
            key: 'single',
            label: '',
            recipientName: order.recipientName,
            recipientPhone: order.recipientPhone,
            deliveryMethod: order.deliveryMethod,
            storeName: order.storeName,
            storeId: order.storeId,
            deliveryAddress: order.deliveryAddress,
            traditional: order.traditionalQty,
            simplified: order.simplifiedQty,
          },
        ]

  return (
    <div className="min-h-screen bg-white">
      {/* 列印控制列（列印時隱藏）*/}
      <div className="print:hidden flex items-center gap-3 border-b px-6 py-4 bg-muted/30">
        <span className="text-sm text-muted-foreground">
          出貨單預覽{slips.length > 1 ? `（共 ${slips.length} 份）` : ''}
        </span>
        <PrintButton />
      </div>

      {slips.map((slip, idx) => {
        const isCVS = slip.deliveryMethod === 'sevenEleven' || slip.deliveryMethod === 'familyMart'
        return (
          <div
            key={slip.key}
            className="max-w-2xl mx-auto px-8 py-10 space-y-6"
            style={idx < slips.length - 1 ? { breakAfter: 'page' } : undefined}
          >
            {/* 標題 */}
            <div className="border-b pb-4">
              <h1 className="text-xl font-bold">出貨單 {slip.label}</h1>
              <p className="text-sm text-muted-foreground mt-1">
                申請編號：#{order.id}
              </p>
            </div>

            {/* 課程資訊 */}
            {(order.inviteTitle || order.catalogLabel) && (
              <section className="space-y-1">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">課程資訊</h2>
                <div className="grid grid-cols-[120px_1fr] gap-y-2 text-sm">
                  {order.inviteTitle && (
                    <>
                      <span className="text-muted-foreground">課程名稱</span>
                      <span>{order.inviteTitle}</span>
                    </>
                  )}
                  <span className="text-muted-foreground">書本名稱</span>
                  <span>{order.catalogLabel || '（未填）'}</span>
                </div>
              </section>
            )}

            {/* 收件資訊 */}
            <section className="space-y-1">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">收件資訊</h2>
              <div className="grid grid-cols-[120px_1fr] gap-y-2 text-sm">
                <span className="text-muted-foreground">收件人</span>
                <span>{slip.recipientName || '（未填）'}</span>
                <span className="text-muted-foreground">連絡電話</span>
                <span>{slip.recipientPhone || '（未填）'}</span>
                <span className="text-muted-foreground">寄件方式</span>
                <span>{DELIVERY_METHOD_LABELS[slip.deliveryMethod] ?? slip.deliveryMethod}</span>
                {isCVS ? (
                  <>
                    <span className="text-muted-foreground">門市名稱</span>
                    <span>{slip.storeName || '（未填）'}</span>
                    <span className="text-muted-foreground">門市店號</span>
                    <span>{slip.storeId || '（未填）'}</span>
                  </>
                ) : (
                  <>
                    <span className="text-muted-foreground">收件地址</span>
                    <span>{slip.deliveryAddress || '（未填）'}</span>
                  </>
                )}
              </div>
            </section>

            {/* 書本統計 */}
            <section className="space-y-1">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">書本內容與數量</h2>
              <div className="grid grid-cols-[120px_1fr] gap-y-2 text-sm">
                <span className="text-muted-foreground">繁體版</span>
                <span>{slip.traditional} 本</span>
                <span className="text-muted-foreground">簡體版</span>
                <span>{slip.simplified} 本</span>
                <span className="text-muted-foreground font-medium">合計</span>
                <span className="font-medium">{slip.traditional + slip.simplified} 本</span>
              </div>
            </section>

            {/* 其他 */}
            <section className="space-y-1">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">其他資訊</h2>
              <div className="grid grid-cols-[120px_1fr] gap-y-2 text-sm">
                <span className="text-muted-foreground">預計開課日期</span>
                <span>{order.courseDate}</span>
                {order.taxId && (
                  <>
                    <span className="text-muted-foreground">統一編號</span>
                    <span>{order.taxId}</span>
                  </>
                )}
              </div>
            </section>
          </div>
        )
      })}
    </div>
  )
}
