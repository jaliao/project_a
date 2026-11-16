/*
 * ----------------------------------------------
 * Data Layer - 我的學習（分段查經筆記）
 * 2026-08-28
 * lib/data/learning-study.ts
 * ----------------------------------------------
 */

import { prisma } from '@/lib/prisma'
import type { LearningStudyEntry } from '@prisma/client'
import { getCatalogOutline, getOutlineCatalogIds, isLessonCompleted } from '@/config/learning-outline'
import { isFriend } from '@/lib/data/friendship'

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

/**
 * 查看者（viewer）可唯讀查看某學員（author）哪些課程目錄的分段查經筆記。
 * 四條件任一成立即可見：本人／好友（viewer 已將 author 加好友，可見 author 全部已解鎖目錄）／
 * 同班（同一次開課 approved 報名有交集，僅該目錄可見）／
 * 講師（viewer 在 author 擔任講師的開課下 approved 報名，僅該開課對應目錄可見）。
 */
export async function getViewableLearningCatalogIds(
  viewerId: string,
  authorId: string
): Promise<number[]> {
  const authorUnlockedIds = await getUnlockedLearningCatalogIds(authorId)
  if (viewerId === authorId) return authorUnlockedIds
  if (authorUnlockedIds.length === 0) return []

  if (await isFriend(viewerId, authorId)) return authorUnlockedIds

  const [authorRows, viewerRows, instructorRows] = await Promise.all([
    prisma.inviteEnrollment.findMany({
      where: {
        userId: authorId,
        status: 'approved',
        invite: {
          cancelledAt: null,
          startedAt: { not: null },
          courseCatalogId: { in: authorUnlockedIds },
        },
      },
      select: { inviteId: true, invite: { select: { courseCatalogId: true } } },
    }),
    prisma.inviteEnrollment.findMany({
      where: { userId: viewerId, status: 'approved', invite: { cancelledAt: null } },
      select: { inviteId: true },
    }),
    prisma.inviteEnrollment.findMany({
      where: {
        userId: viewerId,
        status: 'approved',
        invite: {
          cancelledAt: null,
          createdById: authorId,
          courseCatalogId: { in: authorUnlockedIds },
        },
      },
      select: { invite: { select: { courseCatalogId: true } } },
    }),
  ])

  const viewerInviteIds = new Set(viewerRows.map((r) => r.inviteId))
  const visibleCatalogIds = new Set<number>()
  for (const row of authorRows) {
    if (viewerInviteIds.has(row.inviteId)) visibleCatalogIds.add(row.invite.courseCatalogId)
  }
  for (const row of instructorRows) {
    visibleCatalogIds.add(row.invite.courseCatalogId)
  }
  return Array.from(visibleCatalogIds)
}

/** 單一課程目錄版本，供「我的學習」子頁路由守衛使用。 */
export async function canViewLearningCatalog(
  viewerId: string,
  authorId: string,
  courseCatalogId: number
): Promise<boolean> {
  if (viewerId === authorId) return true
  const ids = await getViewableLearningCatalogIds(viewerId, authorId)
  return ids.includes(courseCatalogId)
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

/**
 * 各「有大綱」課程目錄的分段查經作業完成度（供個人首頁學習進度三卡）。
 * done 口徑與「我的學習」書籍卡片頁／子頁頂部一致（isLessonCompleted：done 或 noScripture）。
 */
export async function getLearningProgressByCatalog(
  userId: string
): Promise<Record<number, { done: number; total: number }>> {
  const result: Record<number, { done: number; total: number }> = {}
  for (const catalogId of getOutlineCatalogIds()) {
    const outline = getCatalogOutline(catalogId)
    if (!outline) continue
    const filledSlots = await getFilledOutlineSlots(userId, catalogId)
    result[catalogId] = {
      total: outline.lessons.length,
      done: outline.lessons.filter((l) => isLessonCompleted(l, filledSlots)).length,
    }
  }
  return result
}
