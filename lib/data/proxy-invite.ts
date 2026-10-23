/*
 * ----------------------------------------------
 * 資料存取層 - 代填學員邀請 Token
 * 2026-10-22
 * lib/data/proxy-invite.ts
 * ----------------------------------------------
 */

import { randomBytes } from 'crypto'
import { prisma } from '@/lib/prisma'

const INVITE_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000 // 30 天

export async function getValidInviteToken(token: string) {
  return prisma.proxyInviteToken.findFirst({
    where: {
      token,
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
  })
}

// 完成註冊頁用：token 有效且對應帳號仍為代填狀態才視為可完成註冊，否則回傳 null（連結已失效）
export async function getActiveInviteForToken(token: string) {
  const inviteToken = await getValidInviteToken(token)
  if (!inviteToken) return null

  const user = await prisma.user.findUnique({
    where: { id: inviteToken.userId },
    select: { isProxyMember: true },
  })
  if (!user?.isProxyMember) return null

  return inviteToken
}

export async function markInviteTokenUsed(id: string) {
  return prisma.proxyInviteToken.update({
    where: { id },
    data: { usedAt: new Date() },
  })
}

// 作廢該使用者名下所有尚未使用的邀請 token（補發邀請前先呼叫）
export async function invalidatePendingTokens(userId: string) {
  await prisma.proxyInviteToken.updateMany({
    where: { userId, usedAt: null },
    data: { usedAt: new Date() },
  })
}

export async function createInviteToken(userId: string, email: string) {
  const token = randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + INVITE_TOKEN_TTL_MS)
  return prisma.proxyInviteToken.create({
    data: { token, userId, email, expiresAt },
  })
}
