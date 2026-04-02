/*
 * ----------------------------------------------
 * 後台會員管理頁
 * 2026-04-01
 * app/(user)/admin/members/page.tsx
 * ----------------------------------------------
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { auth } from '@/lib/auth'
import { searchMembers } from '@/lib/data/members'
import { MemberResetButton } from '@/components/admin/member-reset-button'
import { MemberSearchInput } from '@/components/admin/member-search-input'
import { Button } from '@/components/ui/button'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: '會員管理 — 啟動事工',
}

export default async function AdminMembersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const isAdmin =
    session.user.role === 'admin' || session.user.role === 'superadmin'
  if (!isAdmin) redirect('/')

  const { q } = await searchParams
  const members = await searchMembers(q)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">會員管理</h1>
        <span className="text-sm text-muted-foreground">{members.length} 位會員</span>
      </div>

      {/* 搜尋列 */}
      <Suspense fallback={null}>
        <MemberSearchInput />
      </Suspense>

      <div className="rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">姓名</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Email</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">靈人編號</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">加入日期</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">操作</th>
            </tr>
          </thead>
          <tbody>
            {members.map((member, i) => {
              const displayName = member.realName || member.name || '（未填）'
              const joinDate = member.createdAt.toLocaleDateString('zh-TW', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
              })
              return (
                <tr
                  key={member.id}
                  className={i < members.length - 1 ? 'border-b' : ''}
                >
                  <td className="px-4 py-3 font-medium">{displayName}</td>
                  <td className="px-4 py-3 text-muted-foreground">{member.email}</td>
                  <td className="px-4 py-3 font-mono text-xs">
                    {member.spiritId ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{joinDate}</td>
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
        {members.length === 0 && (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">
            {q ? '查無符合的會員' : '尚無會員資料'}
          </p>
        )}
      </div>
    </div>
  )
}
