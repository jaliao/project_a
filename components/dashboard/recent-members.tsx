/*
 * ----------------------------------------------
 * RecentMembers - 近期加入會員列表
 * 2026-03-23
 * components/dashboard/recent-members.tsx
 * ----------------------------------------------
 */

import { formatDistanceToNow } from 'date-fns'
import { zhTW } from 'date-fns/locale'

interface Member {
  id: string
  name: string | null
  email: string
  createdAt: Date
}

interface RecentMembersProps {
  members: Member[]
}

export function RecentMembers({ members }: RecentMembersProps) {
  if (members.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-6">
        <h2 className="font-semibold mb-4">近期加入會員</h2>
        <p className="text-sm text-muted-foreground text-center py-8">
          尚無活動記錄
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border bg-card p-6">
      <h2 className="font-semibold mb-4">近期加入會員</h2>
      <div className="space-y-4">
        {members.map((member) => (
          <div key={member.id} className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium leading-none">
                {member.name ?? '（未設定）'}
              </p>
              <p className="text-sm text-muted-foreground mt-1">{member.email}</p>
            </div>
            <p className="text-xs text-muted-foreground whitespace-nowrap">
              {formatDistanceToNow(member.createdAt, {
                addSuffix: true,
                locale: zhTW,
              })}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
