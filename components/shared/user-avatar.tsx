/*
 * ----------------------------------------------
 * UserAvatar - 使用者頭像共用顯示元件
 * 2026-08-03
 * components/shared/user-avatar.tsx
 *
 * 純顯示元件：avatarUrl 為 null 時不渲染 AvatarImage，
 * 由 Radix Avatar 自動 fallback 顯示 AvatarFallback（姓名首字）
 * ----------------------------------------------
 */

import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'

type UserAvatarProps = {
  avatarUrl: string | null
  displayName: string
  size?: 'default' | 'sm' | 'lg'
  className?: string
}

export function UserAvatar({ avatarUrl, displayName, size = 'default', className }: UserAvatarProps) {
  return (
    <Avatar size={size} className={className}>
      {avatarUrl && <AvatarImage src={avatarUrl} alt={displayName} />}
      <AvatarFallback>{displayName.slice(0, 1)}</AvatarFallback>
    </Avatar>
  )
}
