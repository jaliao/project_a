/*
 * ----------------------------------------------
 * Data Layer - 學習歷程回饋
 * 2026-07-02
 * lib/data/learning-feedback.ts
 * ----------------------------------------------
 */

import { prisma } from '@/lib/prisma'
import { getMemberDisplayName, type DisplayNameMode } from '@/lib/utils/member-display'
import type { FeedbackCategory, FeedbackStatus } from '@prisma/client'

const PAGE_SIZE = 30

const displaySelect = {
  realName: true,
  englishName: true,
  nickname: true,
  displayNameMode: true,
} as const

type DisplayUser = {
  realName: string | null
  englishName: string | null
  nickname: string | null
  displayNameMode: DisplayNameMode
}

// ── 學員：查看自己送出的回饋 ──
export type MyFeedbackItem = {
  id: number
  category: FeedbackCategory
  teacherName: string
  courseCatalogLabel: string
  note: string | null
  status: FeedbackStatus
  adminNote: string | null
  createdAt: Date
}

export async function getMyLearningFeedbacks(userId: string): Promise<MyFeedbackItem[]> {
  const rows = await prisma.learningRecordFeedback.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      category: true,
      teacherName: true,
      note: true,
      status: true,
      adminNote: true,
      createdAt: true,
      courseCatalog: { select: { label: true } },
    },
  })
  return rows.map((r) => ({
    id: r.id,
    category: r.category,
    teacherName: r.teacherName,
    courseCatalogLabel: r.courseCatalog.label,
    note: r.note,
    status: r.status,
    adminNote: r.adminNote,
    createdAt: r.createdAt,
  }))
}

// ── 後台：回饋審核清單（pending 優先）──
export type FeedbackListItem = {
  id: number
  userId: string
  submitterName: string
  submitterSpiritId: string | null
  category: FeedbackCategory
  teacherName: string
  courseCatalogId: number
  courseCatalogLabel: string
  note: string | null
  status: FeedbackStatus
  adminNote: string | null
  resolvedByName: string | null
  resolvedAt: Date | null
  resultInviteId: number | null
  createdAt: Date
}

export type FeedbackListResult = {
  items: FeedbackListItem[]
  total: number
  totalPages: number
  page: number
  pageSize: number
}

export async function getLearningFeedbackList(opts: {
  status?: FeedbackStatus | 'all'
  page?: number
}): Promise<FeedbackListResult> {
  const status = opts.status ?? 'pending'
  const page = Math.max(1, opts.page ?? 1)
  const where = status === 'all' ? {} : { status }

  const [total, rows] = await Promise.all([
    prisma.learningRecordFeedback.count({ where }),
    prisma.learningRecordFeedback.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        userId: true,
        category: true,
        teacherName: true,
        courseCatalogId: true,
        note: true,
        status: true,
        adminNote: true,
        resolvedAt: true,
        resultInviteId: true,
        createdAt: true,
        user: { select: { spiritId: true, ...displaySelect } },
        courseCatalog: { select: { label: true } },
        resolvedBy: { select: displaySelect },
      },
    }),
  ])

  return {
    items: rows.map((r) => ({
      id: r.id,
      userId: r.userId,
      submitterName: getMemberDisplayName(r.user as DisplayUser),
      submitterSpiritId: r.user.spiritId,
      category: r.category,
      teacherName: r.teacherName,
      courseCatalogId: r.courseCatalogId,
      courseCatalogLabel: r.courseCatalog.label,
      note: r.note,
      status: r.status,
      adminNote: r.adminNote,
      resolvedByName: r.resolvedBy ? getMemberDisplayName(r.resolvedBy as DisplayUser) : null,
      resolvedAt: r.resolvedAt,
      resultInviteId: r.resultInviteId,
      createdAt: r.createdAt,
    })),
    total,
    totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    page,
    pageSize: PAGE_SIZE,
  }
}

// ── 後台：待處理回饋數（儀錶板提示）──
export async function getPendingFeedbackCount(): Promise<number> {
  return prisma.learningRecordFeedback.count({ where: { status: 'pending' } })
}

// ── 後台：教師選擇器（依姓名/teacherNo 搜尋，限具講師身分者）──
export type TeacherOption = {
  id: string
  name: string
  teacherNo: string | null
  spiritId: string | null
}

export async function searchTeachers(q: string, limit = 20): Promise<TeacherOption[]> {
  const term = q.trim()
  const rows = await prisma.user.findMany({
    where: {
      roles: { hasSome: ['teacher_1', 'teacher_2', 'teacher_3'] },
      ...(term
        ? {
            OR: [
              { realName: { contains: term, mode: 'insensitive' } },
              { nickname: { contains: term, mode: 'insensitive' } },
              { teacherNo: { contains: term, mode: 'insensitive' } },
            ],
          }
        : {}),
    },
    orderBy: [{ teacherNo: 'asc' }, { realName: 'asc' }],
    take: limit,
    select: { id: true, spiritId: true, teacherNo: true, ...displaySelect },
  })
  return rows.map((r) => ({
    id: r.id,
    name: getMemberDisplayName(r as DisplayUser),
    teacherNo: r.teacherNo,
    spiritId: r.spiritId,
  }))
}

// ── 後台：學員既有報名（供 wrong_teacher / not_graduated 定位）──
export type UserEnrollmentItem = {
  enrollmentId: number
  inviteId: number
  inviteTitle: string
  courseCatalogLabel: string
  teacherName: string
  graduatedAt: Date | null
  nonGraduateReason: string | null
}

export async function getUserEnrollmentsForFeedback(userId: string): Promise<UserEnrollmentItem[]> {
  const rows = await prisma.inviteEnrollment.findMany({
    where: { userId },
    orderBy: { joinedAt: 'desc' },
    select: {
      id: true,
      inviteId: true,
      graduatedAt: true,
      nonGraduateReason: true,
      invite: {
        select: {
          title: true,
          courseCatalog: { select: { label: true } },
          createdBy: { select: displaySelect },
        },
      },
    },
  })
  return rows.map((r) => ({
    enrollmentId: r.id,
    inviteId: r.inviteId,
    inviteTitle: r.invite.title,
    courseCatalogLabel: r.invite.courseCatalog.label,
    teacherName: getMemberDisplayName(r.invite.createdBy as DisplayUser),
    graduatedAt: r.graduatedAt,
    nonGraduateReason: r.nonGraduateReason,
  }))
}
