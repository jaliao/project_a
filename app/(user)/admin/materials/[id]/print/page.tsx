/*
 * ----------------------------------------------
 * 出貨單列印頁面
 * 2026-03-30
 * app/(user)/admin/materials/[id]/print/page.tsx
 * ----------------------------------------------
 */

import { notFound, redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { getCourseOrderForPrint } from '@/lib/data/course-order'
import { getEnrollmentMaterialSummary } from '@/lib/data/course-sessions'
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
  const session = await auth()
  if (!session?.user) redirect('/login')

  const isAdmin =
    session.user.role === 'admin' || session.user.role === 'superadmin'
  if (!isAdmin) redirect('/')

  const orderId = parseInt(id, 10)
  if (isNaN(orderId)) notFound()

  const order = await getCourseOrderForPrint(orderId)
  if (!order) notFound()

  // 統計學員書本選擇
  const materialSummary = order.inviteId
    ? await getEnrollmentMaterialSummary(order.inviteId)
    : { traditional: 0, simplified: 0 }

  const isCVS = order.deliveryMethod === 'sevenEleven' || order.deliveryMethod === 'familyMart'

  return (
    <div className="min-h-screen bg-white">
      {/* 列印控制列（列印時隱藏）*/}
      <div className="print:hidden flex items-center gap-3 border-b px-6 py-4 bg-muted/30">
        <span className="text-sm text-muted-foreground">出貨單預覽</span>
        <PrintButton />
      </div>

      {/* 出貨單主體 */}
      <div className="max-w-2xl mx-auto px-8 py-10 space-y-6">

        {/* 標題 */}
        <div className="border-b pb-4">
          <h1 className="text-xl font-bold">出貨單</h1>
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
            <span className="text-muted-foreground">收件者</span>
            <span>{order.buyerNameZh}</span>
            <span className="text-muted-foreground">寄件方式</span>
            <span>{DELIVERY_METHOD_LABELS[order.deliveryMethod] ?? order.deliveryMethod}</span>
            {isCVS ? (
              <>
                <span className="text-muted-foreground">門市名稱</span>
                <span>{order.storeName || '（未填）'}</span>
                <span className="text-muted-foreground">門市店號</span>
                <span>{order.storeId || '（未填）'}</span>
              </>
            ) : (
              <>
                <span className="text-muted-foreground">收件地址</span>
                <span>{order.deliveryAddress || '（未填）'}</span>
              </>
            )}
          </div>
        </section>

        {/* 書本統計 */}
        <section className="space-y-1">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">書本內容與數量</h2>
          <div className="grid grid-cols-[120px_1fr] gap-y-2 text-sm">
            <span className="text-muted-foreground">繁體版</span>
            <span>{materialSummary.traditional} 本</span>
            <span className="text-muted-foreground">簡體版</span>
            <span>{materialSummary.simplified} 本</span>
            <span className="text-muted-foreground font-medium">合計</span>
            <span className="font-medium">
              {materialSummary.traditional + materialSummary.simplified} 本
            </span>
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
    </div>
  )
}
