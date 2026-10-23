/*
 * ----------------------------------------------
 * MemberProxyInviteHistory - 代填學員邀請紀錄（唯讀，未註冊會員專區分頁）
 * 2026-10-23
 * components/admin/member-proxy-invite-history.tsx
 *
 * 純顯示歷史列表，不含任何編輯元件（編輯邀請 Email／補發邀請已移至會員首頁）。
 * 對所有會員恆顯示，不依 isProxyMember 切換內容。
 * ----------------------------------------------
 */

import { Badge } from '@/components/ui/badge'
import { PROXY_INVITE_STATUS_LABELS, getProxyInviteStatus, type ProxyInviteStatus } from '@/lib/data/proxy-invite'

export type ProxyInviteHistoryItem = {
  id: string
  email: string
  createdAt: Date
  expiresAt: Date
  usedAt: Date | null
  voidedAt: Date | null
}

function fmtDateTime(d: Date): string {
  return d.toLocaleString('zh-TW', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  })
}

const STATUS_BADGE_CLASS: Record<ProxyInviteStatus, string> = {
  completed: 'border-green-300 bg-green-50 text-green-800',
  voided: 'border-gray-300 bg-gray-50 text-gray-600',
  expired: 'border-amber-300 bg-amber-50 text-amber-800',
  active: 'border-blue-300 bg-blue-50 text-blue-800',
}

export function MemberProxyInviteHistory({ items }: { items: ProxyInviteHistoryItem[] }) {
  if (items.length === 0) {
    return <p className="px-4 py-6 text-center text-sm text-muted-foreground">尚無邀請紀錄</p>
  }

  return (
    <ul className="divide-y">
      {items.map((item) => {
        const status = getProxyInviteStatus(item)
        return (
          <li key={item.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
            <div className="space-y-0.5">
              <p className="font-medium">{item.email}</p>
              <p className="text-xs text-muted-foreground">
                核發於 {fmtDateTime(item.createdAt)}　·　過期於 {fmtDateTime(item.expiresAt)}
              </p>
            </div>
            <Badge variant="outline" className={`text-xs ${STATUS_BADGE_CLASS[status]}`}>
              {PROXY_INVITE_STATUS_LABELS[status]}
            </Badge>
          </li>
        )
      })}
    </ul>
  )
}
