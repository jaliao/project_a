/*
 * ----------------------------------------------
 * Data Layer - 課程學員管理查詢
 * 2026-07-14 (Updated: 2026-07-17)
 * lib/data/invite-students.ts
 *
 * 學員清單由課程頁 getCourseSessionById 提供；
 * 此處僅保留「Email 或啟動編號」查既有會員（新增學員確認列用）。
 * ----------------------------------------------
 */

import { prisma } from '@/lib/prisma'
import { getMemberDisplayName, type DisplayNameMode } from '@/lib/utils/member-display'

export type MemberByIdentifier = {
  userId: string
  realName: string | null
  email: string
  displayName: string
  spiritId: string | null
}

/**
 * 以 Email 或啟動編號（spiritId）查既有會員（新增學員表單確認列用）
 * 含 "@" 視為 Email（不分大小寫精確比對）；否則視為啟動編號（精確比對）
 */
export async function findMemberByIdentifier(identifier: string): Promise<MemberByIdentifier | null> {
  const value = identifier.trim()
  if (!value) return null

  const user = value.includes('@')
    ? await prisma.user.findUnique({
        where: { email: value.toLowerCase() },
        select: { id: true, realName: true, englishName: true, nickname: true, displayNameMode: true, spiritId: true, email: true },
      })
    : await prisma.user.findUnique({
        where: { spiritId: value },
        select: { id: true, realName: true, englishName: true, nickname: true, displayNameMode: true, spiritId: true, email: true },
      })

  if (!user) return null
  return {
    userId: user.id,
    realName: user.realName,
    email: user.email,
    displayName: getMemberDisplayName({
      realName: user.realName,
      englishName: user.englishName,
      nickname: user.nickname,
      displayNameMode: user.displayNameMode as DisplayNameMode,
    }),
    spiritId: user.spiritId,
  }
}
