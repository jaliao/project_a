/*
 * ----------------------------------------------
 * 後台會員管理頁
 * 2026-04-01 (Updated: 2026-06-12)
 * app/(user)/admin/members/page.tsx
 * ----------------------------------------------
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { auth } from '@/lib/auth'
import { canAccessAdmin, ROLE_LABELS } from '@/lib/auth-roles'
import type { Gender, UserRole } from '@prisma/client'
import { searchMembers, hasAnyMemberFilter, type MemberFilters } from '@/lib/data/members'
import { getActiveChurches } from '@/lib/data/churches'
import { getMemberDisplayName } from '@/lib/utils/member-display'
import { MemberResetButton } from '@/components/admin/member-reset-button'
import { MembersFilter } from '@/components/admin/members-filter'
import { MembersPagination } from '@/components/admin/members-pagination'
import { CreateMemberDialog } from '@/components/admin/create-member-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: '會員管理 — 啟動事工',
}

export default async function AdminMembersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; gender?: string; role?: string; church?: string; page?: string }>
}) {
  const session = await auth()
  if (!session?.user) redirect('/login')
  if (!canAccessAdmin(session.user.roles)) redirect('/')

  const sp = await searchParams
  const filters: MemberFilters = {
    q: sp.q,
    gender: sp.gender as Gender | undefined,
    role: sp.role as UserRole | undefined,
    church: sp.church,
  }
  const page = Math.max(1, Number(sp.page) || 1)
  const active = hasAnyMemberFilter(filters)

  const [churches, result] = await Promise.all([
    getActiveChurches(),
    active ? searchMembers(filters, page) : Promise.resolve(null),
  ])

  // 匯出連結帶上目前篩選參數
  const exportParams = new URLSearchParams()
  if (filters.q) exportParams.set('q', filters.q)
  if (filters.gender) exportParams.set('gender', filters.gender)
  if (filters.role) exportParams.set('role', filters.role)
  if (filters.church) exportParams.set('church', filters.church)
  const exportQs = exportParams.size ? `?${exportParams.toString()}` : ''

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">會員管理</h1>
        <div className="flex items-center gap-2">
          <CreateMemberDialog />
          {active && result && (
            <>
              <span className="text-sm text-muted-foreground">共 {result.total} 筆</span>
              <a
                href={`/api/admin/members/export${exportQs}`}
                className="inline-flex h-8 items-center rounded-md border border-input bg-background px-3 text-xs font-medium shadow-sm hover:bg-accent hover:text-accent-foreground"
              >
                匯出 {result.total} 筆
              </a>
            </>
          )}
          <a
            href="/api/admin/members/export"
            className="inline-flex h-8 items-center rounded-md border border-input bg-background px-3 text-xs font-medium shadow-sm hover:bg-accent hover:text-accent-foreground"
          >
            匯出全部
          </a>
        </div>
      </div>

      {/* 篩選列 */}
      <Suspense fallback={null}>
        <MembersFilter churches={churches.map((c) => ({ id: c.id, name: c.name }))} />
      </Suspense>

      {!active ? (
        <div className="rounded-lg border p-10 text-center text-sm text-muted-foreground">
          請輸入搜尋或選擇篩選條件以顯示會員
        </div>
      ) : result && result.items.length > 0 ? (
        <>
          <div className="rounded-lg border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">啟動編號</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">姓名</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Email</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">身分</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">操作</th>
                </tr>
              </thead>
              <tbody>
                {result.items.map((member, i) => {
                  const displayName = getMemberDisplayName(member)
                  return (
                    <tr key={member.id} className={i < result.items.length - 1 ? 'border-b' : ''}>
                      <td className="px-4 py-3 font-mono text-xs">{member.spiritId ?? '—'}</td>
                      <td className="px-4 py-3 font-medium">{displayName}</td>
                      <td className="px-4 py-3 text-muted-foreground">{member.email}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {(member.roles as UserRole[]).map((r) => (
                            <Badge key={r} variant="secondary" className="text-xs">
                              {ROLE_LABELS[r] ?? r}
                            </Badge>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/admin/members/${member.id}`}>查看詳情</Link>
                          </Button>
                          <MemberResetButton userId={member.id} memberName={displayName} />
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {result.pageCount > 1 && (
            <Suspense fallback={null}>
              <MembersPagination page={result.page} pageCount={result.pageCount} />
            </Suspense>
          )}
        </>
      ) : (
        <div className="rounded-lg border p-8 text-center text-sm text-muted-foreground">查無符合的會員</div>
      )}
    </div>
  )
}
