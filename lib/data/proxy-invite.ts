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
      voidedAt: null,
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

// 作廢該使用者名下所有尚未使用且尚未作廢的邀請 token（補發邀請前先呼叫）
// 寫入 voidedAt（不寫 usedAt）：usedAt 僅代表受邀者實際完成註冊，與補發作廢是獨立語意
export async function invalidatePendingTokens(userId: string) {
  await prisma.proxyInviteToken.updateMany({
    where: { userId, usedAt: null, voidedAt: null },
    data: { voidedAt: new Date() },
  })
}

export async function createInviteToken(userId: string, email: string) {
  const token = randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + INVITE_TOKEN_TTL_MS)
  return prisma.proxyInviteToken.create({
    data: { token, userId, email, expiresAt },
  })
}

export type ProxyInviteStatus = 'completed' | 'voided' | 'expired' | 'active'

export const PROXY_INVITE_STATUS_LABELS: Record<ProxyInviteStatus, string> = {
  completed: '已完成註冊',
  voided: '已作廢',
  expired: '已過期',
  active: '有效',
}

// 狀態判定優先序：usedAt → voidedAt → expiresAt → 有效
export function getProxyInviteStatus(invite: {
  usedAt: Date | null
  voidedAt: Date | null
  expiresAt: Date
}): ProxyInviteStatus {
  if (invite.usedAt) return 'completed'
  if (invite.voidedAt) return 'voided'
  if (invite.expiresAt < new Date()) return 'expired'
  return 'active'
}

// 後台「未註冊會員專區」唯讀歷史列表：依核發時間新到舊排序
export async function getProxyInviteHistory(userId: string) {
  return prisma.proxyInviteToken.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  })
}

// 判定某老師是否為該會員所屬班級的授課老師：
// 該會員名下存在至少一筆 InviteEnrollment，其所屬 CourseInvite.createdById 為該老師本人（不限 status）
export async function isClassTeacherOfMember(teacherId: string, memberId: string): Promise<boolean> {
  const enrollment = await prisma.inviteEnrollment.findFirst({
    where: { userId: memberId, invite: { createdById: teacherId } },
    select: { id: true },
  })
  return !!enrollment
}
