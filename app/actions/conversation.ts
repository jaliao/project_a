/*
 * ----------------------------------------------
 * Server Actions - 訊息（任何會員互傳，支援多人群組）
 * 2026-08-03 (Updated: 2026-08-03)
 * app/actions/conversation.ts
 * ----------------------------------------------
 */

'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { conversationMessageSchema } from '@/lib/schemas/conversation'
import { createNotification } from '@/app/actions/notification'
import {
  getMyConversations,
  getConversationMessages,
  findConversationsWithUser,
  previewNewConversationWithUser,
  type ConversationSummary,
  type ConversationWithMessages,
} from '@/lib/data/conversation'

type ActionResponse = {
  success: boolean
  message?: string
  errors?: Record<string, string[]>
  conversationId?: number
}

// 通知該對話中除寄件者外的所有其他參與者（群組時等於通知所有其他成員）
async function notifyOthers(conversationId: number, senderId: string) {
  const participants = await prisma.conversationParticipant.findMany({
    where: { conversationId, userId: { not: senderId } },
    select: { userId: true },
  })

  await Promise.all(
    participants.map((p) =>
      createNotification(p.userId, '有新訊息', '您收到一則新的訊息。').catch((e) => {
        console.error('[conversation] 通知寫入失敗', e)
      })
    )
  )
}

async function isParticipant(conversationId: number, userId: string): Promise<boolean> {
  const row = await prisma.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId, userId } },
  })
  return !!row
}

// ── 任何登入使用者：對某會員建立一筆全新對話（是否接續既有對話由呼叫端「選擇畫面」決定，這裡不再自動判斷）──
export async function startConversation(targetUserId: string, body: string): Promise<ActionResponse> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, message: '請先登入' }
  if (targetUserId === session.user.id) return { success: false, message: '無法對自己傳送訊息' }

  const target = await prisma.user.findUnique({ where: { id: targetUserId }, select: { id: true } })
  if (!target) return { success: false, message: '找不到對象' }

  const parsed = conversationMessageSchema.safeParse({ body })
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors }
  }

  const conversation = await prisma.$transaction(async (tx) => {
    const conv = await tx.conversation.create({
      data: { createdById: session.user.id },
    })
    await tx.conversationParticipant.createMany({
      data: [
        { conversationId: conv.id, userId: targetUserId },
        { conversationId: conv.id, userId: session.user.id, lastReadAt: new Date() },
      ],
    })
    await tx.conversationMessage.create({
      data: { conversationId: conv.id, authorId: session.user.id, body: parsed.data.body },
    })
    return conv
  })

  await notifyOthers(conversation.id, session.user.id)

  return { success: true, message: '訊息已送出', conversationId: conversation.id }
}

// ── 該對話參與者：於既有對話送出訊息 ──
export async function sendConversationMessage(conversationId: number, body: string): Promise<ActionResponse> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, message: '請先登入' }

  const parsed = conversationMessageSchema.safeParse({ body })
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors }
  }

  if (!(await isParticipant(conversationId, session.user.id))) {
    return { success: false, message: '無權限' }
  }

  await prisma.$transaction(async (tx) => {
    await tx.conversationMessage.create({
      data: { conversationId, authorId: session.user.id, body: parsed.data.body },
    })
    await tx.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: new Date() },
    })
    await tx.conversationParticipant.update({
      where: { conversationId_userId: { conversationId, userId: session.user.id } },
      data: { lastReadAt: new Date() },
    })
  })

  await notifyOthers(conversationId, session.user.id)

  return { success: true, message: '訊息已送出', conversationId }
}

// ── 標記某對話為已讀 ──
export async function markConversationRead(conversationId: number): Promise<ActionResponse> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, message: '請先登入' }

  if (!(await isParticipant(conversationId, session.user.id))) {
    return { success: false, message: '無權限' }
  }

  await prisma.conversationParticipant.update({
    where: { conversationId_userId: { conversationId, userId: session.user.id } },
    data: { lastReadAt: new Date() },
  })

  return { success: true }
}

// ── 任一參與者：以對方 Spirit ID 邀請其加入對話（不需對方同意）──
export async function inviteToConversation(conversationId: number, targetSpiritId: string): Promise<ActionResponse> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, message: '請先登入' }

  if (!(await isParticipant(conversationId, session.user.id))) {
    return { success: false, message: '無權限' }
  }

  const target = await prisma.user.findUnique({
    where: { spiritId: targetSpiritId.trim().toUpperCase() },
    select: { id: true },
  })
  if (!target) return { success: false, message: '找不到該啟動編號對應的會員' }

  if (target.id === session.user.id) {
    return { success: false, message: '無法邀請自己' }
  }

  if (!(await isParticipant(conversationId, target.id))) {
    await prisma.conversationParticipant.create({
      data: { conversationId, userId: target.id },
    })
    createNotification(target.id, '已被加入對話', '您已被加入一段訊息對話。').catch((e) => {
      console.error('[conversation] 邀請通知寫入失敗', e)
    })
  }

  return { success: true, message: '已邀請加入', conversationId }
}

// ── 任一參與者：修改對話標題（清空則恢復自動命名）──
export async function updateConversationTitle(conversationId: number, title: string): Promise<ActionResponse> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, message: '請先登入' }

  if (!(await isParticipant(conversationId, session.user.id))) {
    return { success: false, message: '無權限' }
  }

  const trimmed = title.trim()
  if (trimmed.length > 100) {
    return { success: false, message: 'validation.conversationTitleTooLong' }
  }

  await prisma.conversation.update({
    where: { id: conversationId },
    data: { title: trimmed || null },
  })

  return { success: true, message: '標題已更新', conversationId }
}

// ── 任一參與者：釘選／取消釘選對話（個人化設定，不影響其他參與者）──
export async function togglePinConversation(conversationId: number): Promise<ActionResponse> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, message: '請先登入' }

  const participant = await prisma.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId, userId: session.user.id } },
  })
  if (!participant) return { success: false, message: '無權限' }

  await prisma.conversationParticipant.update({
    where: { conversationId_userId: { conversationId, userId: session.user.id } },
    data: { pinnedAt: participant.pinnedAt ? null : new Date() },
  })

  return { success: true, conversationId }
}

// ── Drawer 用：讀取本人所有對話（Client Component 呼叫）──
export async function fetchMyConversations(): Promise<ConversationSummary[]> {
  const session = await auth()
  if (!session?.user?.id) return []
  return getMyConversations(session.user.id)
}

// ── Drawer 用：讀取單一對話完整訊息記錄，並標記為已讀 ──
export async function fetchConversationMessages(conversationId: number): Promise<ConversationWithMessages | null> {
  const session = await auth()
  if (!session?.user?.id) return null

  if (!(await isParticipant(conversationId, session.user.id))) {
    return null
  }

  const conversation = await getConversationMessages(conversationId, session.user.id)
  await markConversationRead(conversationId)
  return conversation
}

// ── Drawer 用：「傳訊息」入口——查找與某位對象共同參與的所有既有對話（供選擇畫面）──
export async function fetchConversationsWithUser(targetUserId: string): Promise<ConversationSummary[]> {
  const session = await auth()
  if (!session?.user?.id) return []
  return findConversationsWithUser(session.user.id, targetUserId)
}

// ── Drawer 用：預覽與某位對象「尚未建立」的新對話 ──
export async function fetchPreviewNewConversation(targetUserId: string): Promise<ConversationWithMessages | null> {
  const session = await auth()
  if (!session?.user?.id) return null
  if (targetUserId === session.user.id) return null
  return previewNewConversationWithUser(targetUserId)
}
