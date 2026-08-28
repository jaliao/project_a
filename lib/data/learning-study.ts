/*
 * ----------------------------------------------
 * Data Layer - 我的學習（分段查經筆記）
 * 2026-08-28
 * lib/data/learning-study.ts
 * ----------------------------------------------
 */

import { prisma } from '@/lib/prisma'
import type { LearningStudyEntry } from '@prisma/client'

/**
 * 取得該使用者「已解鎖」的課程目錄 id。
 * 解鎖條件：在該 courseCatalogId 下有任一 status=approved、未取消、
 * 且所屬開課 startedAt 已設定（completedAt 已設定者亦成立）的報名。
 */
export async function getUnlockedLearningCatalogIds(userId: string): Promise<number[]> {
  const rows = await prisma.inviteEnrollment.findMany({
    where: {
      userId,
      status: 'approved',
      invite: {
        cancelledAt: null,
        startedAt: { not: null },
      },
    },
    select: { invite: { select: { courseCatalogId: true } } },
  })
  return Array.from(new Set(rows.map((r) => r.invite.courseCatalogId)))
}

/** 大綱位置鍵：`${lessonKey}::${scriptureKey}` */
export function outlineSlotKey(lessonKey: string, scriptureKey: string): string {
  return `${lessonKey}::${scriptureKey}`
}

/**
 * 取得該使用者在某課程目錄下的所有分段查經筆記，
 * 依大綱位置（lessonKey::scriptureKey）分組，組內以 createdAt 由舊到新排序。
 */
export async function getStudyEntriesForUser(
  userId: string,
  courseCatalogId: number
): Promise<Map<string, LearningStudyEntry[]>> {
  const entries = await prisma.learningStudyEntry.findMany({
    where: { userId, courseCatalogId },
    orderBy: { createdAt: 'asc' },
  })

  const grouped = new Map<string, LearningStudyEntry[]>()
  for (const entry of entries) {
    const k = outlineSlotKey(entry.lessonKey, entry.scriptureKey)
    const list = grouped.get(k)
    if (list) list.push(entry)
    else grouped.set(k, [entry])
  }
  return grouped
}

/**
 * 取得該使用者在某課程目錄下「已有至少一筆筆記」的經文位置集合，
 * key = `${lessonKey}::${scriptureKey}`（= outlineSlotKey）。
 * 供課次卡片的四態（無需填寫／待填寫／填寫中／已完成）配色與進度計算使用。
 */
export async function getFilledOutlineSlots(
  userId: string,
  courseCatalogId: number
): Promise<Set<string>> {
  const rows = await prisma.learningStudyEntry.findMany({
    where: { userId, courseCatalogId },
    select: { lessonKey: true, scriptureKey: true },
    distinct: ['lessonKey', 'scriptureKey'],
  })
  return new Set(rows.map((r) => outlineSlotKey(r.lessonKey, r.scriptureKey)))
}
