/*
 * ----------------------------------------------
 * Data Layer - 學員上課意願
 * 2026-09-14
 * lib/data/learning-intent.ts
 *
 * cr-spec-260914-001：學員首頁「我想上課」刊登意願，
 * 與媒合布告欄「找學員」頁籤（列出刊登中學員）共用資料層。
 * ----------------------------------------------
 */

import type { Gender, LearningTimePreference, UserRole } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { getMemberDisplayName } from '@/lib/utils/member-display'
import { resolveAvatarUrl } from '@/lib/utils/avatar'

export type MyLearningIntent = {
  courseCatalogIds: number[]
  timePreferences: LearningTimePreference[]
  otherNote: string | null
}

// ==========================================
// 取得本人目前刊登中的上課意願（首頁按鈕狀態／編輯預填用）
// ==========================================
export async function getMyLearningIntent(userId: string): Promise<MyLearningIntent | null> {
  return prisma.learningIntent.findUnique({
    where: { userId },
    select: { courseCatalogIds: true, timePreferences: true, otherNote: true },
  })
}

export type MatchableStudent = {
  userId: string
  spiritId: string | null
  displayName: string
  avatarUrl: string | null
  gender: Gender
  unitLabel: string | null
  roles: UserRole[]
  courseLabels: string[]
  timePreferences: LearningTimePreference[]
  otherNote: string | null
  createdAt: Date
  isFriend: boolean
}

// ==========================================
// 取得「找學員」頁籤清單：所有刊登中學員（排除自己），依刊登時間新到舊排序
// ==========================================
export async function getMatchableStudents(excludeUserId: string): Promise<MatchableStudent[]> {
  const rows = await prisma.learningIntent.findMany({
    where: { userId: { not: excludeUserId } },
    orderBy: { createdAt: 'desc' },
    select: {
      userId: true,
      courseCatalogIds: true,
      timePreferences: true,
      otherNote: true,
      createdAt: true,
      user: {
        select: {
          spiritId: true,
          avatarKey: true,
          image: true,
          realName: true,
          englishName: true,
          nickname: true,
          displayNameMode: true,
          gender: true,
          roles: true,
          churchType: true,
          churchOther: true,
          church: { select: { name: true } },
        },
      },
    },
  })

  if (rows.length === 0) return []

  // 批次解析課程標籤（避免逐筆查詢）
  const allCourseIds = Array.from(new Set(rows.flatMap((r) => r.courseCatalogIds)))
  const courses = allCourseIds.length
    ? await prisma.courseCatalog.findMany({
        where: { id: { in: allCourseIds } },
        select: { id: true, label: true },
      })
    : []
  const courseLabelById = new Map(courses.map((c) => [c.id, c.label]))

  // 批次判斷好友狀態（避免逐筆呼叫 isFriend）
  const friendships = await prisma.friendship.findMany({
    where: { ownerId: excludeUserId, friendId: { in: rows.map((r) => r.userId) } },
    select: { friendId: true },
  })
  const friendIdSet = new Set(friendships.map((f) => f.friendId))

  return rows.map((r) => ({
    userId: r.userId,
    spiritId: r.user.spiritId,
    displayName: getMemberDisplayName(r.user),
    avatarUrl: resolveAvatarUrl(r.user),
    gender: r.user.gender,
    unitLabel:
      r.user.churchType === 'church'
        ? (r.user.church?.name ?? null)
        : r.user.churchType === 'other'
          ? (r.user.churchOther ?? null)
          : null,
    roles: r.user.roles,
    courseLabels: r.courseCatalogIds
      .map((id) => courseLabelById.get(id))
      .filter((label): label is string => !!label),
    timePreferences: r.timePreferences,
    otherNote: r.otherNote,
    createdAt: r.createdAt,
    isFriend: friendIdSet.has(r.userId),
  }))
}
