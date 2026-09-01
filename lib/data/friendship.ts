/*
 * ----------------------------------------------
 * Data Layer - 社群好友（單向）
 * 2026-09-01
 * lib/data/friendship.ts
 * ----------------------------------------------
 */

import { prisma } from '@/lib/prisma'
import { getMemberDisplayName } from '@/lib/utils/member-display'
import { resolveAvatarUrl } from '@/lib/utils/avatar'

export type FriendListItem = {
  userId: string
  spiritId: string | null
  displayName: string
  avatarUrl: string | null
  addedAt: Date
}

// ==========================================
// 取得目前使用者的好友清單（依加入時間新到舊）
// ==========================================
export async function getMyFriends(userId: string): Promise<FriendListItem[]> {
  const rows = await prisma.friendship.findMany({
    where: { ownerId: userId },
    orderBy: { createdAt: 'desc' },
    select: {
      createdAt: true,
      friend: {
        select: {
          id: true,
          spiritId: true,
          avatarKey: true,
          image: true,
          realName: true,
          englishName: true,
          nickname: true,
          displayNameMode: true,
        },
      },
    },
  })

  return rows.map((r) => ({
    userId: r.friend.id,
    spiritId: r.friend.spiritId,
    displayName: getMemberDisplayName(r.friend),
    avatarUrl: resolveAvatarUrl(r.friend),
    addedAt: r.createdAt,
  }))
}

// ==========================================
// 是否已將 friendId 加入 ownerId 的好友清單
// ==========================================
export async function isFriend(ownerId: string, friendId: string): Promise<boolean> {
  return (await prisma.friendship.count({ where: { ownerId, friendId } })) > 0
}
