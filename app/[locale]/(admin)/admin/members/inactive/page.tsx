/*
 * ----------------------------------------------
 * 後台未啟用會員清單
 * 2026-06-29 (Updated: 2026-07-03)
 * app/(user)/admin/members/inactive/page.tsx
 *
 * 列出從未登入過（lastLoginAt 為 null）的會員，供管理者追蹤尚未設定帳號者。
 * ----------------------------------------------
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { ROLE_LABELS } from '@/lib/auth-roles'
import type { UserRole } from '@prisma/client'
import { listInactiveMembers } from '@/lib/data/account-recovery'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MaskedValue } from '@/components/admin/masked-value'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: '未啟用會員 — 啟動事工',
}

function formatDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}/${m}/${day}`
}

export default async function InactiveMembersPage() {
  // 守衛（登入 + admin 身分）由 (admin)/layout.tsx 統一處理
  const members = await listInactiveMembers()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">未啟用會員</h1>
          <p className="text-sm text-muted-foreground">從未登入過的會員（尚未設定自己的帳號資料）</p>
        </div>
        <span className="text-sm text-muted-foreground">共 {members.length} 筆</span>
      </div>

      {members.length === 0 ? (
        <div className="rounded-lg border p-10 text-center text-sm text-muted-foreground">
          目前無未啟用會員
        </div>
      ) : (
        <div className="rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">啟動編號</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">姓名</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Email</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">身分</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">建立時間</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">臨時密碼</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">操作</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m, i) => (
                <tr key={m.id} className={i < members.length - 1 ? 'border-b' : ''}>
                  <td className="px-4 py-3 font-mono text-xs">{m.spiritId ?? '—'}</td>
                  <td className="px-4 py-3 font-medium">{m.displayName}</td>
                  <td className="px-4 py-3 text-muted-foreground"><MaskedValue value={m.email} label="Email" /></td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {(m.roles as UserRole[]).map((r) => (
                        <Badge key={r} variant="secondary" className="text-xs">
                          {ROLE_LABELS[r] ?? r}
                        </Badge>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(m.createdAt)}</td>
                  <td className="px-4 py-3">
                    {m.isTempPassword ? (
                      <Badge variant="outline" className="text-xs">臨時密碼</Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">已自設</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/admin/members/${m.id}`}>查看詳情</Link>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
