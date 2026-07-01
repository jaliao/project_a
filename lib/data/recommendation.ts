/*
 * ----------------------------------------------
 * Data Layer - 推薦講師清單與計數
 * 2026-07-01
 * lib/data/recommendation.ts
 *
 * 推薦＝InviteEnrollment.teacherRecommended = true（老師講師資格回饋）。
 * 狀態推導：accepted（已具對應書籍講師身分）> deferred（暫不接受）> pending（未處理）。
 * ----------------------------------------------
 */

import { prisma } from '@/lib/prisma'
import { TEACHER_ROLE_BY_CATALOG } from '@/lib/auth-roles'
import { getMemberDisplayName, type DisplayNameMode } from '@/lib/utils/member-display'

const PAGE_SIZE = 30

export type RecommendationStatus = 'pending' | 'deferred' | 'accepted'

export type RecommendationItem = {
  enrollmentId: number
  userId: string
  displayName: string
  spiritId: string | null
  courseCatalogId: number
  bookLabel: string
  teacherName: string
  feedbackNote: string | null
  feedbackAt: Date | null
  status: RecommendationStatus
  deferredAt: Date | null
  deferredByName: string | null
  deferralNote: string | null
}

export type RecommendationListResult = {
  items: RecommendationItem[]
  total: number
  totalPages: number
  page: number
}

const displaySelect = {
  realName: true,
  englishName: true,
  nickname: true,
  displayNameMode: true,
} as const

function deriveStatus(roles: string[], catalogId: number, deferredAt: Date | null): RecommendationStatus {
  const role = TEACHER_ROLE_BY_CATALOG[catalogId]
  if (role && roles.includes(role)) return 'accepted'
  if (deferredAt) return 'deferred'
  return 'pending'
}

type DisplayUser = {
  realName: string | null
  englishName: string | null
  nickname: string | null
  displayNameMode: DisplayNameMode
}

async function fetchRecommendations() {
  return prisma.inviteEnrollment.findMany({
    where: { teacherRecommended: true },
    orderBy: { teacherFeedbackAt: 'desc' },
    select: {
      id: true,
      teacherFeedbackNote: true,
      teacherFeedbackAt: true,
      recommendDeferredAt: true,
      recommendDeferralNote: true,
      user: { select: { id: true, spiritId: true, roles: true, ...displaySelect } },
      recommendDeferredBy: { select: displaySelect },
      invite: {
        select: {
          courseCatalogId: true,
          courseCatalog: { select: { label: true } },
          createdBy: { select: displaySelect },
        },
      },
    },
  })
}

function toItem(r: Awaited<ReturnType<typeof fetchRecommendations>>[number]): RecommendationItem {
  const status = deriveStatus(r.user.roles as string[], r.invite.courseCatalogId, r.recommendDeferredAt)
  return {
    enrollmentId: r.id,
    userId: r.user.id,
    displayName: getMemberDisplayName(r.user),
    spiritId: r.user.spiritId,
    courseCatalogId: r.invite.courseCatalogId,
    bookLabel: r.invite.courseCatalog.label,
    teacherName: getMemberDisplayName(r.invite.createdBy as DisplayUser),
    feedbackNote: r.teacherFeedbackNote,
    feedbackAt: r.teacherFeedbackAt,
    status,
    deferredAt: r.recommendDeferredAt,
    deferredByName: r.recommendDeferredBy ? getMemberDisplayName(r.recommendDeferredBy as DisplayUser) : null,
    deferralNote: r.recommendDeferralNote,
  }
}

export async function getRecommendationList(opts: {
  status?: RecommendationStatus | 'all'
  page?: number
}): Promise<RecommendationListResult> {
  const status = opts.status ?? 'pending'
  const page = Math.max(1, opts.page ?? 1)

  const rows = await fetchRecommendations()
  let items = rows.map(toItem)
  if (status !== 'all') items = items.filter((i) => i.status === status)

  const total = items.length
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  return {
    items: items.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    total,
    totalPages,
    page: safePage,
  }
}

// 未處理推薦筆數（供儀錶板）
export async function getPendingRecommendationCount(): Promise<number> {
  const rows = await fetchRecommendations()
  return rows.filter(
    (r) => deriveStatus(r.user.roles as string[], r.invite.courseCatalogId, r.recommendDeferredAt) === 'pending'
  ).length
}
