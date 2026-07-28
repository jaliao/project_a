/*
 * ----------------------------------------------
 * 後台實體證書製作管理頁
 * 2026-07-01 (Updated: 2026-07-14)
 * app/[locale]/(admin)/admin/certificates/page.tsx
 *
 * 卡片式清單：主標題＝真實姓名中英並列（證書製作依據），
 * 附顯示名稱/啟動編號與性別/單位等身分確認資訊。
 * ----------------------------------------------
 */

export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import { IconGenderAgender, IconGenderFemale, IconGenderMale } from '@tabler/icons-react'
import { getCertificateProductionList, type CertificateStatus } from '@/lib/data/certificate'
import { CertificateFilter } from '@/components/admin/certificate-filter'
import { CertificateProduceButton, CertificateNoteCell } from '@/components/admin/certificate-cells'
import { Badge } from '@/components/ui/badge'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from '@/components/ui/pagination'

export const metadata: Metadata = {
  title: '證書製作 — 啟動事工',
}

function fmtDate(d: Date): string {
  return new Date(d).toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

// 頁碼視窗：總頁數 <=7 全列出；否則顯示頭尾＋目前頁前後各 1 頁，其餘以單一 'ellipsis' 收合
function getPaginationRange(current: number, total: number): (number | 'ellipsis')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages = [...new Set([1, total, current - 1, current, current + 1])].filter(
    (p) => p >= 1 && p <= total
  )
  pages.sort((a, b) => a - b)
  const result: (number | 'ellipsis')[] = []
  let prev = 0
  for (const p of pages) {
    if (prev && p - prev > 1) result.push('ellipsis')
    result.push(p)
    prev = p
  }
  return result
}

// 性別以 icon 呈現於姓名旁（未指定用中性 icon、淡色）
function GenderIcon({ gender }: { gender: string }) {
  if (gender === 'male') {
    return <IconGenderMale className="size-4 shrink-0 text-blue-500" aria-label="男" />
  }
  if (gender === 'female') {
    return <IconGenderFemale className="size-4 shrink-0 text-rose-500" aria-label="女" />
  }
  return <IconGenderAgender className="size-4 shrink-0 text-muted-foreground/50" aria-label="未指定" />
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
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {result.items.map((it) => {
              // 真實姓名中英並列；兩者皆未填顯示警示
              const realNameText = [it.realName, it.englishName].filter(Boolean).join(' ')
              return (
                <div key={`${it.userId}:${it.courseCatalogId}`} className="flex flex-col gap-3 rounded-lg border p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-1.5">
                      {realNameText ? (
                        <p className="text-base font-semibold break-words">{realNameText}</p>
                      ) : (
                        <p className="text-base font-semibold text-destructive">未填真實姓名</p>
                      )}
                      <GenderIcon gender={it.gender} />
                    </div>
                    {it.producedAt ? (
                      <Badge className="shrink-0 bg-green-100 text-green-700 hover:bg-green-100">已完成</Badge>
                    ) : (
                      <Badge variant="outline" className="shrink-0 text-muted-foreground">未完成</Badge>
                    )}
                  </div>

                  {/* 欄位依序：啟動編號、顯示名稱、單位、階層－結業時間（行距一致；中英文姓名已在主標題） */}
                  <div className="space-y-1.5 text-sm">
                    <p>
                      <span className="text-muted-foreground">啟動編號：</span>
                      {it.spiritId ? <span className="font-mono">{it.spiritId}</span> : '—'}
                    </p>
                    <p className="break-words">
                      <span className="text-muted-foreground">顯示名稱：</span>
                      {it.displayName}
                    </p>
                    <p className="break-words">
                      <span className="text-muted-foreground">單位：</span>
                      {it.churchLabel ?? '—'}
                    </p>
                    <p>
                      <span className="text-muted-foreground">{it.courseCatalogLabel} 結業：</span>
                      {fmtDate(it.graduatedAt)}
                    </p>
                    {it.producedAt && (
                      <p className="text-muted-foreground">
                        製作：{fmtDate(it.producedAt)}
                        {it.producedByName ? ` · ${it.producedByName}` : ''}
                      </p>
                    )}
                  </div>

                  <div className="mt-auto space-y-3">
                    <CertificateNoteCell userId={it.userId} courseCatalogId={it.courseCatalogId} initialNote={it.note} />
                    <div className="flex justify-end">
                      <CertificateProduceButton userId={it.userId} courseCatalogId={it.courseCatalogId} produced={it.producedAt != null} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {result.totalPages > 1 && (
            <div className="flex flex-col items-center gap-2 sm:flex-row sm:justify-between">
              <span className="text-sm text-muted-foreground">
                第 {result.page} / {result.totalPages} 頁・共 {result.total} 筆
              </span>
              <Pagination className="mx-0 w-auto">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href={qs(Math.max(1, result.page - 1))}
                      aria-disabled={result.page <= 1}
                      className={result.page <= 1 ? 'pointer-events-none opacity-50' : undefined}
                    />
                  </PaginationItem>
                  {getPaginationRange(result.page, result.totalPages).map((p, i) =>
                    p === 'ellipsis' ? (
                      <PaginationItem key={`ellipsis-${i}`}>
                        <PaginationEllipsis />
                      </PaginationItem>
                    ) : (
                      <PaginationItem key={p}>
                        <PaginationLink href={qs(p)} isActive={p === result.page}>
                          {p}
                        </PaginationLink>
                      </PaginationItem>
                    )
                  )}
                  <PaginationItem>
                    <PaginationNext
                      href={qs(Math.min(result.totalPages, result.page + 1))}
                      aria-disabled={result.page >= result.totalPages}
                      className={result.page >= result.totalPages ? 'pointer-events-none opacity-50' : undefined}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </>
      )}
    </div>
  )
}
