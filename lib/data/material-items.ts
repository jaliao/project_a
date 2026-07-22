/*
 * ----------------------------------------------
 * Data Layer - 教材書本項目（逐本）
 * 2026-07-01
 * lib/data/material-items.ts
 *
 * 某課程「已核准且選了版本」的每筆報名＝一個書本項目 { 學員, 書本名字, 版本 }。
 * ----------------------------------------------
 */

import { prisma } from '@/lib/prisma'
import { getMemberDisplayName } from '@/lib/utils/member-display'

export type BookVersion = 'traditional' | 'simplified' | 'english'

export type BookItem = {
  enrollmentId: number
  userId: string
  studentName: string
  bookName: string
  version: BookVersion
}

// 書本名字預設：中文名 → 英文名 → 匿名
export function defaultBookName(u: { realName: string | null; englishName: string | null }): string {
  return u.realName || u.englishName || '匿名'
}

// 取某會員的預設書本名字（申購對話框預帶用）
export async function getDefaultBookNameForUser(userId: string): Promise<string> {
  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: { realName: true, englishName: true },
  })
  return defaultBookName({ realName: u?.realName ?? null, englishName: u?.englishName ?? null })
}

// 取得某課程的書本項目清單（已核准、materialChoice ≠ none）
export async function getCourseBookItems(inviteId: number): Promise<BookItem[]> {
  const rows = await prisma.inviteEnrollment.findMany({
    where: { inviteId, status: 'approved', materialChoice: { not: 'none' } },
    orderBy: { joinedAt: 'asc' },
    select: {
      id: true,
      userId: true,
      materialChoice: true,
      materialBookName: true,
      user: { select: { realName: true, englishName: true, nickname: true, displayNameMode: true } },
    },
  })
  return rows.map((r) => ({
    enrollmentId: r.id,
    userId: r.userId,
    studentName: getMemberDisplayName(r.user),
    bookName: r.materialBookName || defaultBookName(r.user),
    version: r.materialChoice as BookVersion,
  }))
}

// 尚未被任何訂單地址指派的書本項目（本次多地址申請可指派範圍）
export async function getUnassignedBookItems(inviteId: number): Promise<BookItem[]> {
  const items = await getCourseBookItems(inviteId)
  // 加購項目 enrollmentId 為 null，不佔用學員書本項目，明確排除
  const assigned = await prisma.materialShipmentItem.findMany({
    where: { enrollmentId: { not: null }, enrollment: { inviteId } },
    select: { enrollmentId: true },
  })
  const assignedSet = new Set(assigned.map((a) => a.enrollmentId))
  return items.filter((i) => !assignedSet.has(i.enrollmentId))
}
