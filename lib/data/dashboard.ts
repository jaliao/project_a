/*
 * ----------------------------------------------
 * Data Layer - 後台儀錶板統計查詢
 * 2026-04-03 (Updated: 2026-07-02)
 * lib/data/dashboard.ts
 * ----------------------------------------------
 */

import { prisma } from '@/lib/prisma'

// 教會分布列（教會名稱＋會員數）
export type ChurchDistributionItem = {
  name: string
  count: number
}

// 年齡分布列（固定組距＋人數）
export type AgeDistributionItem = {
  bucket: string
  count: number
}

// 性別人數
export type GenderCounts = {
  male: number
  female: number
  unspecified: number
}

// 年齡固定七組距（年齡＝當年 − birthYear，近似值）
const AGE_BUCKETS = [
  { label: '20 歲以下', min: 0, max: 20 },
  { label: '21–30', min: 21, max: 30 },
  { label: '31–40', min: 31, max: 40 },
  { label: '41–50', min: 41, max: 50 },
  { label: '51–60', min: 51, max: 60 },
  { label: '61–70', min: 61, max: 70 },
  { label: '71 歲以上', min: 71, max: Infinity },
] as const

export type DashboardStats = {
  // 學員分析
  totalMembers: number
  activeMembers7d: number
  churchDistribution: ChurchDistributionItem[]
  otherChurchCount: number
  noChurchCount: number
  genderCounts: GenderCounts
  ageDistribution: AgeDistributionItem[]
  noBirthYearCount: number
  // 講師分析
  spiritInstructors: number
  richInstructors: number
  victoryInstructors: number
  // 課程分析
  recruitingCourseSessions: number
  activeCourseSessions: number
  completedCourseSessions: number
  cancelledCourseSessions: number
}

/**
 * 取得儀錶板整體統計數據
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  const [
    totalMembers,
    activeMembers7d,
    churchGroups,
    otherChurchCount,
    noChurchCount,
    genderGroups,
    birthYearGroups,
    noBirthYearCount,
    spiritInstructors,
    richInstructors,
    victoryInstructors,
    recruitingCourseSessions,
    activeCourseSessions,
    completedCourseSessions,
    cancelledCourseSessions,
  ] = await Promise.all([
    // 學員總數
    prisma.user.count(),
    // 近期活躍學員數（7 天內登入）
    prisma.user.count({ where: { lastLoginAt: { gte: sevenDaysAgo } } }),
    // 各教會會員數（選清單教會者，依教會分組）
    prisma.user.groupBy({
      by: ['churchId'],
      where: { churchType: 'church', churchId: { not: null } },
      _count: { _all: true },
    }),
    // 其他（自填）
    prisma.user.count({ where: { churchType: 'other' } }),
    // 未填
    prisma.user.count({ where: { churchType: 'none' } }),
    // 性別分布
    prisma.user.groupBy({ by: ['gender'], _count: { _all: true } }),
    // 出生年分布（已填者）
    prisma.user.groupBy({
      by: ['birthYear'],
      where: { birthYear: { not: null } },
      _count: { _all: true },
    }),
    // 出生年未填
    prisma.user.count({ where: { birthYear: null } }),
    // 啟動講師（持有 teacher_1 身分）
    prisma.user.count({ where: { roles: { has: 'teacher_1' } } }),
    // 豐盛講師（持有 teacher_2 身分）
    prisma.user.count({ where: { roles: { has: 'teacher_2' } } }),
    // 得勝講師（持有 teacher_3 身分）
    prisma.user.count({ where: { roles: { has: 'teacher_3' } } }),
    // 招募中課程總數（未開始、未取消、未結業）
    prisma.courseInvite.count({
      where: {
        startedAt: null,
        cancelledAt: null,
        completedAt: null,
      },
    }),
    // 進行中課程總數（已開始、未取消、未結業）
    prisma.courseInvite.count({
      where: {
        startedAt: { not: null },
        cancelledAt: null,
        completedAt: null,
      },
    }),
    // 已結業課程總數（未取消；與已放棄互斥）
    prisma.courseInvite.count({
      where: { completedAt: { not: null }, cancelledAt: null },
    }),
    // 已放棄課程總數
    prisma.courseInvite.count({
      where: { cancelledAt: { not: null } },
    }),
  ])

  // 教會 id → 名稱對照，組出分布清單（人數多到少，僅列有會員的教會）
  const churchIds = churchGroups
    .map((g) => g.churchId)
    .filter((id): id is number => id !== null)
  const churches = churchIds.length
    ? await prisma.church.findMany({
        where: { id: { in: churchIds } },
        select: { id: true, name: true },
      })
    : []
  const churchNameById = new Map(churches.map((c) => [c.id, c.name]))
  const churchDistribution: ChurchDistributionItem[] = churchGroups
    .filter((g) => g.churchId !== null && g._count._all > 0)
    .map((g) => ({
      name: churchNameById.get(g.churchId!) ?? `（教會 #${g.churchId}）`,
      count: g._count._all,
    }))
    .sort((a, b) => b.count - a.count)

  // 性別人數（groupBy 結果補 0）
  const genderCounts: GenderCounts = { male: 0, female: 0, unspecified: 0 }
  for (const g of genderGroups) {
    genderCounts[g.gender] = g._count._all
  }

  // 年齡分組（年齡＝當年 − birthYear，落入固定七組距；含 0 人組距維持軸連續）
  const currentYear = new Date().getFullYear()
  const ageDistribution: AgeDistributionItem[] = AGE_BUCKETS.map((b) => ({
    bucket: b.label,
    count: 0,
  }))
  for (const g of birthYearGroups) {
    if (g.birthYear === null) continue
    const age = currentYear - g.birthYear
    const idx = AGE_BUCKETS.findIndex((b) => age >= b.min && age <= b.max)
    if (idx >= 0) ageDistribution[idx].count += g._count._all
  }

  return {
    totalMembers,
    activeMembers7d,
    churchDistribution,
    otherChurchCount,
    noChurchCount,
    genderCounts,
    ageDistribution,
    noBirthYearCount,
    spiritInstructors,
    richInstructors,
    victoryInstructors,
    recruitingCourseSessions,
    activeCourseSessions,
    completedCourseSessions,
    cancelledCourseSessions,
  }
}
