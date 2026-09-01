/*
 * ----------------------------------------------
 * Server Actions - 社群好友（單向、即時、免對方同意）
 * 2026-09-01
 * app/actions/friendship.ts
 * ----------------------------------------------
 */

'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { getMemberDisplayName } from '@/lib/utils/member-display'
import { createNotification } from '@/app/actions/notification'
import { getMyFriends, isFriend, type FriendListItem } from '@/lib/data/friendship'

type ActionResponse = {
  success: boolean
  message?: string
  friendUserId?: string
  alreadyFriend?: boolean
}

// ── 以啟動編號加好友（手動輸入 / 掃描條碼共用）──
export async function addFriendBySpiritId(spiritId: string): Promise<ActionResponse> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, message: '請先登入' }
  const me = session.user.id

  const target = await prisma.user.findUnique({
    where: { spiritId: spiritId.trim().toUpperCase() },
    select: {
      id: true,
      realName: true,
      englishName: true,
      nickname: true,
      displayNameMode: true,
    },
  })
  if (!target) return { success: false, message: '找不到該啟動編號對應的會員' }
  if (target.id === me) return { success: false, message: '無法加自己為好友' }

  if (await isFriend(me, target.id)) {
    return { success: true, message: '已經是好友', friendUserId: target.id, alreadyFriend: true }
  }

  try {
    await prisma.friendship.create({ data: { ownerId: me, friendId: target.id } })
  } catch {
    // @@unique 併發撞單 → 視為已成功
    return { success: true, message: '已經是好友', friendUserId: target.id, alreadyFriend: true }
  }

  // fire-and-forget 通知對方
  const myUser = await prisma.user.findUnique({
    where: { id: me },
    select: { realName: true, englishName: true, nickname: true, displayNameMode: true },
  })
  const myName = myUser ? getMemberDisplayName(myUser) : '有人'
  createNotification(target.id, '有人加你為社群好友', `${myName} 已將你加入社群好友。`).catch((e) => {
    console.error('[friendship] 加好友通知寫入失敗', e)
  })

  revalidatePath('/messages')
  return { success: true, message: '已加入好友', friendUserId: target.id }
}

// ── 從自己的好友清單移除某人（不影響對方、不通知）──
export async function removeFriend(friendUserId: string): Promise<ActionResponse> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, message: '請先登入' }

  await prisma.friendship.deleteMany({
    where: { ownerId: session.user.id, friendId: friendUserId },
  })
  revalidatePath('/messages')
  return { success: true }
}

// ── 重新取得自己的好友清單（給 client tab 加/移除後刷新用）──
export async function fetchMyFriends(): Promise<FriendListItem[]> {
  const session = await auth()
  if (!session?.user?.id) return []
  return getMyFriends(session.user.id)
}
