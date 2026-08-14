/*
 * ----------------------------------------------
 * MemberTag - 後台專用會員標籤
 * 2026-08-04 (Updated: 2026-08-04)
 * components/admin/member-tag.tsx
 *
 * 左右兩欄：左欄頭像，右欄依序為啟動編號／單位／
 * 顯示名稱（真實名稱）＋性別／身分標籤／檢視／訊息操作
 * （cr-spec-260804-001，版面調整 cr-spec-260804-005）
 * ----------------------------------------------
 */

'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { IconExternalLink, IconMessage } from '@tabler/icons-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { UserAvatar } from '@/components/shared/user-avatar'
import { GenderIcon, type Gender } from '@/components/shared/gender-icon'
import { getIdentityTags } from '@/lib/utils/identity-tags'
import { withRealName } from '@/lib/utils/member-display'

// 會員標籤所需的會員摘要資訊（各資料層組出後傳入此元件）
export type MemberTagInfo = {
  id: string
  spiritId: string | null
  roles: string[]
  displayName: string
  realName: string | null
  gender: Gender
  churchLabel: string | null
  avatarUrl: string | null
}

type MemberTagProps = MemberTagInfo

export function MemberTag({
  id,
  spiritId,
  roles,
  displayName,
  realName,
  gender,
  churchLabel,
  avatarUrl,
}: MemberTagProps) {
  const router = useRouter()
  const identityTags = getIdentityTags(roles)

  return (
    <div className="flex gap-3 rounded-lg border bg-background p-3">
      <UserAvatar avatarUrl={avatarUrl} displayName={displayName} size="lg" />
      <div className="min-w-0 flex-1 space-y-1">
        <p className="font-mono text-xs text-muted-foreground">{spiritId ?? '—'}</p>
        <p className="truncate text-xs text-muted-foreground">{churchLabel ?? '—'}</p>
        <div className="flex items-center gap-1.5">
          <p className="truncate text-sm font-medium">{withRealName(displayName, realName)}</p>
          <GenderIcon gender={gender} />
        </div>
        {identityTags.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {identityTags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-[10px]">
                {tag}
              </Badge>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">—</p>
        )}
        <div className="flex items-center gap-1">
          <Button size="icon" variant="ghost" className="size-8" asChild>
            <Link href={`/admin/members/${id}`} target="_blank" rel="noopener noreferrer" aria-label="檢視">
              <IconExternalLink className="h-4 w-4" />
            </Link>
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="size-8"
            aria-label="訊息"
            onClick={() => router.push(`/messages?with=${id}`)}
          >
            <IconMessage className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
