/*
 * ----------------------------------------------
 * Server Actions - 社群好友（單向、即時、免對方同意）
 * 2026-09-01 (Updated: 2026-09-14)
 * app/actions/friendship.ts
 *
 * cr-spec-260914-001：抽出共用核心 createFriendshipCore（重複檢查／建立／
 * 通知），供以啟動編號加好友（addFriendBySpiritId）與以 userId 直接加好友
 * （addFriendByUserId，供「找學員」卡片使用）共用，避免邏輯分岔。
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

// ── 共用核心：me 將 targetId 加入好友（重複檢查／建立／通知），不含 auth／輸入解析 ──
async function createFriendshipCore(me: string, targetId: string): Promise<ActionResponse> {
  if (targetId === me) return { success: false, message: '無法加自己為好友' }

  if (await isFriend(me, targetId)) {
    return { success: true, message: '已經是好友', friendUserId: targetId, alreadyFriend: true }
  }

  try {
    await prisma.friendship.create({ data: { ownerId: me, friendId: targetId } })
  } catch {
    // @@unique 併發撞單 → 視為已成功
    return { success: true, message: '已經是好友', friendUserId: targetId, alreadyFriend: true }
  }

  // fire-and-forget 通知對方
  const myUser = await prisma.user.findUnique({
    where: { id: me },
    select: { realName: true, englishName: true, nickname: true, displayNameMode: true },
  })
  const myName = myUser ? getMemberDisplayName(myUser) : '有人'
  createNotification(targetId, '有人加你為社群好友', `${myName} 已將你加入社群好友。`).catch((e) => {
    console.error('[friendship] 加好友通知寫入失敗', e)
  })

  return { success: true, message: '已加入好友', friendUserId: targetId }
}

// ── 以啟動編號加好友（手動輸入 / 掃描條碼共用）──
export async function addFriendBySpiritId(spiritId: string): Promise<ActionResponse> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, message: '請先登入' }
  const me = session.user.id

  const target = await prisma.user.findUnique({
    where: { spiritId: spiritId.trim().toUpperCase() },
    select: { id: true },
  })
  if (!target) return { success: false, message: '找不到該啟動編號對應的會員' }

  const result = await createFriendshipCore(me, target.id)
  if (result.success) revalidatePath('/messages')
  return result
}

// ── 以 userId 直接加好友（找學員頁籤卡片使用，對方已知 userId 免查啟動編號）──
export async function addFriendByUserId(targetUserId: string): Promise<ActionResponse> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, message: '請先登入' }
  const me = session.user.id

  const target = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { id: true },
  })
  if (!target) return { success: false, message: '找不到該會員' }

  const result = await createFriendshipCore(me, target.id)
  if (result.success) {
    revalidatePath('/messages')
    revalidatePath('/match-board')
  }
  return result
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

// ── 切換好友釘選（個人化置頂；不通知對方、不影響對方清單與傳訊息）──
export async function togglePinFriend(friendUserId: string): Promise<ActionResponse> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, message: '請先登入' }

  const row = await prisma.friendship.findUnique({
    where: { ownerId_friendId: { ownerId: session.user.id, friendId: friendUserId } },
    select: { pinnedAt: true },
  })
  if (!row) return { success: false, message: '找不到該好友' }

  await prisma.friendship.update({
    where: { ownerId_friendId: { ownerId: session.user.id, friendId: friendUserId } },
    data: { pinnedAt: row.pinnedAt ? null : new Date() },
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
