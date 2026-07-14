/*
 * ----------------------------------------------
 * Data Layer - 課程學員管理查詢
 * 2026-07-14 (Updated: 2026-07-14)
 * lib/data/invite-students.ts
 *
 * 學員清單由課程頁 getCourseSessionById 提供；
 * 此處僅保留 email 查既有會員（新增學員確認列用）。
 * ----------------------------------------------
 */

import { prisma } from '@/lib/prisma'
import { getMemberDisplayName, type DisplayNameMode } from '@/lib/utils/member-display'

export type MemberByEmail = {
  userId: string
  realName: string | null
  displayName: string
  spiritId: string | null
}

/**
 * 以 email（不分大小寫）查既有會員（新增學員表單確認列用）
 */
export async function findMemberByEmail(email: string): Promise<MemberByEmail | null> {
  const user = await prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
    select: {
      id: true,
      realName: true,
      englishName: true,
      nickname: true,
      displayNameMode: true,
      spiritId: true,
    },
  })
  if (!user) return null
  return {
    userId: user.id,
    realName: user.realName,
    displayName: getMemberDisplayName({
      realName: user.realName,
      englishName: user.englishName,
      nickname: user.nickname,
      displayNameMode: user.displayNameMode as DisplayNameMode,
    }),
    spiritId: user.spiritId,
  }
}
