/*
 * ----------------------------------------------
 * Data Layer - 訊息（任何會員互傳，支援多人群組）
 * 2026-08-03 (Updated: 2026-08-03)
 * lib/data/conversation.ts
 * ----------------------------------------------
 */

import { prisma } from '@/lib/prisma'
import type { Prisma } from '@prisma/client'
import { getMemberDisplayName, type DisplayNameMode } from '@/lib/utils/member-display'
import { resolveAvatarUrl } from '@/lib/utils/avatar'

const displaySelect = {
  realName: true,
  englishName: true,
  nickname: true,
  displayNameMode: true,
} as const

// 對話參與者／訊息作者除了顯示名稱，另需頭像（avatarKey/image）供 UserAvatar 三層 fallback 使用
const messageAuthorSelect = {
  ...displaySelect,
  avatarKey: true,
  image: true,
} as const

type DisplayUser = {
  realName: string | null
  englishName: string | null
  nickname: string | null
  displayNameMode: DisplayNameMode
}

type MessageAuthor = DisplayUser & {
  avatarKey: string | null
  image: string | null
}

export type ConversationMessageItem = {
  id: number
  authorId: string
  authorName: string
  authorAvatarUrl: string | null
  body: string
  createdAt: Date
}

const messageSelect = {
  id: true,
  authorId: true,
  body: true,
  createdAt: true,
  author: { select: messageAuthorSelect },
} as const

function mapMessages(
  rows: { id: number; authorId: string; body: string; createdAt: Date; author: MessageAuthor }[]
): ConversationMessageItem[] {
  return rows.map((r) => ({
    id: r.id,
    authorId: r.authorId,
    authorName: getMemberDisplayName(r.author),
    authorAvatarUrl: resolveAvatarUrl(r.author),
    body: r.body,
    createdAt: r.createdAt,
  }))
}

// 找出對話中「除了 viewerId 以外」的所有其他參與者（支援多人群組，不再假設恰一位）
function findOthers<T extends { userId: string }>(participants: T[], viewerId: string): T[] {
  return participants.filter((p) => p.userId !== viewerId)
}

export type ConversationParticipantInfo = {
  userId: string
  name: string
  avatarUrl: string | null
}

// 對話顯示標題：有自訂標題則用自訂；否則自動組合其他參與者名稱
function resolveDisplayTitle(title: string | null, others: ConversationParticipantInfo[]): string {
  if (title) return title
  if (others.length === 0) return '（無其他成員）'
  if (others.length <= 3) return others.map((o) => o.name).join('、')
  return `${others
    .slice(0, 3)
    .map((o) => o.name)
    .join('、')} 等 ${others.length} 人`
}

// ── 內部共用：依 where 條件查出對話摘要清單（供 getMyConversations／findConversationsWithUser 共用）──
async function getConversationSummaries(userId: string, where: Prisma.ConversationWhereInput): Promise<ConversationSummary[]> {
  const rows = await prisma.conversation.findMany({
    where,
    select: {
      id: true,
      title: true,
      lastMessageAt: true,
      participants: {
        select: {
          userId: true,
          lastReadAt: true,
          pinnedAt: true,
          user: { select: messageAuthorSelect },
        },
      },
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: { body: true },
      },
    },
  })

  const items = rows.map((r) => {
    const me = r.participants.find((p) => p.userId === userId)
    const otherParticipants: ConversationParticipantInfo[] = findOthers(r.participants, userId).map((o) => ({
      userId: o.userId,
      name: getMemberDisplayName(o.user),
      avatarUrl: resolveAvatarUrl(o.user),
    }))
    const isUnread = r.lastMessageAt > (me?.lastReadAt ?? new Date(0))
    return {
      id: r.id,
      title: r.title,
      displayTitle: resolveDisplayTitle(r.title, otherParticipants),
      isGroup: otherParticipants.length > 1,
      otherParticipants,
      lastMessagePreview: r.messages[0]?.body ?? '',
      lastMessageAt: r.lastMessageAt,
      isUnread,
      isPinned: !!me?.pinnedAt,
      pinnedAt: me?.pinnedAt ?? null,
    }
  })

  // 排序：已釘選（依 pinnedAt 倒序）優先，其餘依 lastMessageAt 倒序
  return items.sort((a, b) => {
    if (a.isPinned && b.isPinned) return (b.pinnedAt?.getTime() ?? 0) - (a.pinnedAt?.getTime() ?? 0)
    if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1
    return b.lastMessageAt.getTime() - a.lastMessageAt.getTime()
  })
}

// ── 會員：本人參與的所有對話（已釘選優先，其餘依最新訊息時間倒序）──
export type ConversationSummary = {
  id: number
  title: string | null
  displayTitle: string
  isGroup: boolean
  otherParticipants: ConversationParticipantInfo[]
  lastMessagePreview: string
  lastMessageAt: Date
  isUnread: boolean
  isPinned: boolean
}

export async function getMyConversations(userId: string): Promise<ConversationSummary[]> {
  return getConversationSummaries(userId, { participants: { some: { userId } } })
}

// ── 會員：與某位對象共同參與的所有對話（供「傳訊息」入口選擇既有對話 vs 開新對話）──
export async function findConversationsWithUser(viewerId: string, targetUserId: string): Promise<ConversationSummary[]> {
  return getConversationSummaries(viewerId, {
    AND: [{ participants: { some: { userId: viewerId } } }, { participants: { some: { userId: targetUserId } } }],
  })
}

// ── 會員：單一對話完整訊息記錄（含參與者列表，供成員管理 UI）──
export type ConversationWithMessages = {
  id: number | null
  title: string | null
  displayTitle: string
  isGroup: boolean
  participants: ConversationParticipantInfo[]
  messages: ConversationMessageItem[]
}

export async function getConversationMessages(
  conversationId: number,
  viewerId: string
): Promise<ConversationWithMessages | null> {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: {
      id: true,
      title: true,
      participants: {
        select: { userId: true, user: { select: messageAuthorSelect } },
      },
      messages: { orderBy: { createdAt: 'asc' }, select: messageSelect },
    },
  })
  if (!conversation) return null

  const participants: ConversationParticipantInfo[] = findOthers(conversation.participants, viewerId).map((o) => ({
    userId: o.userId,
    name: getMemberDisplayName(o.user),
    avatarUrl: resolveAvatarUrl(o.user),
  }))

  return {
    id: conversation.id,
    title: conversation.title,
    displayTitle: resolveDisplayTitle(conversation.title, participants),
    isGroup: participants.length > 1,
    participants,
    messages: mapMessages(conversation.messages),
  }
}

// ── 會員：預覽與某位對象「尚未建立」的新對話（僅取對方基本資訊，不查詢既有對話）──
export async function previewNewConversationWithUser(targetUserId: string): Promise<ConversationWithMessages | null> {
  const target = await prisma.user.findUnique({ where: { id: targetUserId }, select: messageAuthorSelect })
  if (!target) return null

  const participants: ConversationParticipantInfo[] = [
    { userId: targetUserId, name: getMemberDisplayName(target), avatarUrl: resolveAvatarUrl(target) },
  ]

  return {
    id: null,
    title: null,
    displayTitle: resolveDisplayTitle(null, participants),
    isGroup: false,
    participants,
    messages: [],
  }
}

// ── 會員：未讀對話數（Topbar 角標用）──
export async function getUnreadConversationCount(userId: string): Promise<number> {
  const participants = await prisma.conversationParticipant.findMany({
    where: { userId },
    select: {
      lastReadAt: true,
      conversation: { select: { lastMessageAt: true } },
    },
  })
  return participants.filter((p) => p.conversation.lastMessageAt > (p.lastReadAt ?? new Date(0))).length
}
