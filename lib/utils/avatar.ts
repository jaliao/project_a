/*
 * ----------------------------------------------
 * 頭像顯示 URL 三層 Fallback 邏輯
 * 2026-08-03
 * lib/utils/avatar.ts
 *
 * ① 自訂上傳（avatarKey）→ ② Google OAuth 頭像（image）→ ③ null（交由 AvatarFallback 處理）
 * ----------------------------------------------
 */

import { getPublicUrl } from '@/lib/storage/r2'

export function resolveAvatarUrl(user: { avatarKey: string | null; image: string | null }): string | null {
  if (user.avatarKey) return getPublicUrl(user.avatarKey)
  return user.image ?? null
}
