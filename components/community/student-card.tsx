/*
 * ----------------------------------------------
 * StudentCard - 學員卡片（社群「好友」頁籤／媒合「找學員」頁籤共用）
 * 2026-09-14
 * components/community/student-card.tsx
 *
 * cr-spec-260914-001：由 friends-list.tsx 抽出的共用呈現元件
 * （頭像／顯示名稱＋性別圖示／單位／身分別標籤），操作區與額外內容
 * 以 slot 傳入，供好友卡片（釘選／傳訊息／刪除）與找學員卡片
 * （上課意願內容＋加好友／傳訊息）分別使用。
 * ----------------------------------------------
 */

import type { ReactNode } from 'react'
import type { Gender, UserRole } from '@prisma/client'
import { useTranslations } from 'next-intl'
import { UserAvatar } from '@/components/shared/user-avatar'
import { GenderIcon } from '@/components/shared/gender-icon'
import { Badge } from '@/components/ui/badge'

type Props = {
  avatarUrl: string | null
  displayName: string
  gender: Gender
  spiritId?: string | null
  unitLabel: string | null
  roles: UserRole[]
  /** 額外內容插槽（例如找學員卡片的上課意願課程／時間條件標籤），置於身分別標籤與操作區之間 */
  extra?: ReactNode
  /** 右下角操作區（例如釘選／傳訊息／刪除，或加好友／傳訊息） */
  actions: ReactNode
}

export function StudentCard({ avatarUrl, displayName, gender, spiritId, unitLabel, roles, extra, actions }: Props) {
  const tRole = useTranslations('role')

  return (
    <div className="flex flex-col gap-3 rounded-lg border p-4">
      <div className="flex items-start gap-3">
        <UserAvatar avatarUrl={avatarUrl} displayName={displayName} />
        <div className="min-w-0">
          <div className="flex items-center gap-1">
            <GenderIcon gender={gender} />
            <p className="truncate text-sm font-medium">{displayName}</p>
          </div>
          {spiritId && <p className="truncate font-mono text-xs text-muted-foreground">{spiritId}</p>}
        </div>
      </div>

      <p className="text-sm text-muted-foreground">{unitLabel ?? '—'}</p>

      <div className="flex flex-wrap gap-1">
        {roles.map((r) => (
          <Badge key={r} variant="secondary" className="text-xs">
            {tRole(r)}
          </Badge>
        ))}
      </div>

      {extra}

      <div className="mt-auto flex gap-2">{actions}</div>
    </div>
  )
}
