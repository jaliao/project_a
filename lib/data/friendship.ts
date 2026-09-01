/*
 * ----------------------------------------------
 * Data Layer - 社群好友（單向）
 * 2026-09-01
 * lib/data/friendship.ts
 *
 * cr-spec-260901-007：FriendListItem 加 pinnedAt / searchText；
 * getMyFriends orderBy 改「釘選優先（pinnedAt desc, nulls last）→ 加入時間新到舊」。
 * ----------------------------------------------
 */

import type { Gender, UserRole } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { getMemberDisplayName } from '@/lib/utils/member-display'
import { resolveAvatarUrl } from '@/lib/utils/avatar'

export type FriendListItem = {
  userId: string
  spiritId: string | null
  displayName: string
  avatarUrl: string | null
  gender: Gender
  unitLabel: string | null
  roles: UserRole[]
  pinnedAt: Date | null
  addedAt: Date
  // 前台好友清單搜尋用：姓名相關欄位＋啟動編號組成的小寫字串（子字串比對）
  searchText: string
}

// ==========================================
// 取得目前使用者的好友清單（釘選優先，其餘依加入時間新到舊）
// ==========================================
export async function getMyFriends(userId: string): Promise<FriendListItem[]> {
  const rows = await prisma.friendship.findMany({
    where: { ownerId: userId },
    orderBy: [{ pinnedAt: { sort: 'desc', nulls: 'last' } }, { createdAt: 'desc' }],
    select: {
      createdAt: true,
      pinnedAt: true,
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
          gender: true,
          roles: true,
          churchType: true,
          churchOther: true,
          church: { select: { name: true } },
        },
      },
    },
  })

  return rows.map((r) => ({
    userId: r.friend.id,
    spiritId: r.friend.spiritId,
    displayName: getMemberDisplayName(r.friend),
    avatarUrl: resolveAvatarUrl(r.friend),
    gender: r.friend.gender,
    unitLabel:
      r.friend.churchType === 'church'
        ? (r.friend.church?.name ?? null)
        : r.friend.churchType === 'other'
          ? (r.friend.churchOther ?? null)
          : null,
    roles: r.friend.roles,
    pinnedAt: r.pinnedAt,
    addedAt: r.createdAt,
    searchText: [r.friend.realName, r.friend.englishName, r.friend.nickname, r.friend.spiritId]
      .filter(Boolean)
      .join(' ')
      .toLowerCase(),
  }))
}

// ==========================================
// 是否已將 friendId 加入 ownerId 的好友清單
// ==========================================
export async function isFriend(ownerId: string, friendId: string): Promise<boolean> {
  return (await prisma.friendship.count({ where: { ownerId, friendId } })) > 0
}
