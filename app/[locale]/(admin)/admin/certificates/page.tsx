/*
 * ----------------------------------------------
 * 後台實體證書製作管理頁
 * 2026-07-01
 * app/[locale]/(admin)/admin/certificates/page.tsx
 * ----------------------------------------------
 */

export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import Link from 'next/link'
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react'
import { getCertificateProductionList, type CertificateStatus } from '@/lib/data/certificate'
import { CertificateFilter } from '@/components/admin/certificate-filter'
import { CertificateProduceButton, CertificateNoteCell } from '@/components/admin/certificate-cells'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: '證書製作 — 啟動事工',
}

function fmtDate(d: Date): string {
  return new Date(d).toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

export default async function AdminCertificatesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; page?: string }>
}) {
  // 守衛（登入 + admin）由 (admin)/layout.tsx 統一處理
  const sp = await searchParams
  const status: CertificateStatus = sp.status === 'done' ? 'done' : 'pending'
  const q = sp.q ?? ''
  const page = Math.max(1, Number(sp.page) || 1)

  const result = await getCertificateProductionList({ status, q, page })

  const qs = (p: number) => {
    const params = new URLSearchParams()
    params.set('status', status)
    if (q) params.set('q', q)
    params.set('page', String(p))
    return `?${params.toString()}`
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">證書製作</h1>
        <span className="text-sm text-muted-foreground">共 {result.total} 筆</span>
      </div>

      <CertificateFilter status={status} q={q} />

      {result.items.length === 0 ? (
        <div className="rounded-lg border p-10 text-center text-sm text-muted-foreground">
          {status === 'done' ? '尚無已完成製作的證書' : '目前沒有待製作的證書'}
        </div>
      ) : (
        <>
          <div className="rounded-lg border overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
                  <th className="px-4 py-3">啟動編號</th>
                  <th className="px-4 py-3">姓名</th>
                  <th className="px-4 py-3">階層</th>
                  <th className="px-4 py-3">結業日</th>
                  <th className="px-4 py-3">狀態</th>
                  <th className="px-4 py-3">製作日期</th>
                  <th className="px-4 py-3">製作管理者</th>
                  <th className="px-4 py-3">備註</th>
                  <th className="px-4 py-3">操作</th>
                </tr>
              </thead>
              <tbody>
                {result.items.map((it) => (
                  <tr key={`${it.userId}:${it.courseCatalogId}`} className="border-b align-top">
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{it.spiritId ?? '—'}</td>
                    <td className="px-4 py-3 font-medium">{it.displayName}</td>
                    <td className="px-4 py-3">{it.courseCatalogLabel}</td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{fmtDate(it.graduatedAt)}</td>
                    <td className="px-4 py-3">
                      {it.producedAt ? (
                        <Badge className="bg-green-100 text-green-700 hover:bg-green-100">已完成</Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">未完成</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{it.producedAt ? fmtDate(it.producedAt) : '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground">{it.producedByName ?? '—'}</td>
                    <td className="px-4 py-3">
                      <CertificateNoteCell userId={it.userId} courseCatalogId={it.courseCatalogId} initialNote={it.note} />
                    </td>
                    <td className="px-4 py-3">
                      <CertificateProduceButton userId={it.userId} courseCatalogId={it.courseCatalogId} produced={it.producedAt != null} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {result.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                第 {result.page} / {result.totalPages} 頁・共 {result.total} 筆
              </span>
              <div className="flex gap-2">
                {result.page > 1 ? (
                  <Button variant="outline" size="sm" asChild>
                    <Link href={qs(result.page - 1)}>
                      <IconChevronLeft className="h-4 w-4" />
                      上一頁
                    </Link>
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" disabled>
                    <IconChevronLeft className="h-4 w-4" />
                    上一頁
                  </Button>
                )}
                {result.page < result.totalPages ? (
                  <Button variant="outline" size="sm" asChild>
                    <Link href={qs(result.page + 1)}>
                      下一頁
                      <IconChevronRight className="h-4 w-4" />
                    </Link>
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" disabled>
                    下一頁
                    <IconChevronRight className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
