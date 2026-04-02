/*
 * ----------------------------------------------
 * 會員顯示名稱元件
 * 2026-04-02
 * components/member/member-display-name.tsx
 * ----------------------------------------------
 */

import { getMemberDisplayName } from '@/lib/utils/member-display'

type Props = {
  realName?: string | null
  englishName?: string | null
  nickname?: string | null
  name?: string | null
  displayNameMode?: 'chinese' | 'english' | null
  className?: string
}

export function MemberDisplayName({ className, ...user }: Props) {
  return <span className={className}>{getMemberDisplayName(user)}</span>
}
