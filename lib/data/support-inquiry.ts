/*
 * ----------------------------------------------
 * Data Layer - 聯繫管理者（學員提問）
 * 2026-07-22 (Updated: 2026-07-22)
 * lib/data/support-inquiry.ts
 * ----------------------------------------------
 */

import { prisma } from '@/lib/prisma'
import { getMemberDisplayName, type DisplayNameMode } from '@/lib/utils/member-display'
import type { SupportInquiryCategory, SupportInquiryStatus, Gender, ChurchType, Prisma } from '@prisma/client'

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

// 性別文字（比照 admin/members/[id]/page.tsx 既有行內邏輯）
export function genderLabel(gender: Gender): string {
  return gender === 'male' ? '男' : gender === 'female' ? '女' : '未設定'
}

// 所屬單位文字（比照 admin/members/[id]/page.tsx 既有行內邏輯）
export function churchLabel(u: {
  churchType: ChurchType
  church: { name: string } | null
  churchOther: string | null
}): string {
  if (u.churchType === 'church' && u.church) return u.church.name
  if (u.churchType === 'other' && u.churchOther) return u.churchOther
  return '—'
}

const submitterSelect = {
  spiritId: true,
  realName: true,
  englishName: true,
  nickname: true,
  displayNameMode: true,
  gender: true,
  churchType: true,
  churchOther: true,
  church: { select: { name: true } },
} as const

// ── 學員：查看自己送出的提問 ──
export type MyInquiryItem = {
  id: number
  category: SupportInquiryCategory
  body: string
  status: SupportInquiryStatus
  replyBody: string | null
  repliedByName: string | null
  repliedAt: Date | null
  createdAt: Date
  courseInviteId: number | null
  courseTitle: string | null
}

export async function getMyInquiries(userId: string): Promise<MyInquiryItem[]> {
  const rows = await prisma.supportInquiry.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      category: true,
      body: true,
      status: true,
      replyBody: true,
      repliedAt: true,
      createdAt: true,
      courseInviteId: true,
      courseInvite: { select: { title: true } },
      repliedBy: { select: displaySelect },
    },
  })
  return rows.map((r) => ({
    id: r.id,
    category: r.category,
    body: r.body,
    status: r.status,
    replyBody: r.replyBody,
    repliedByName: r.repliedBy ? getMemberDisplayName(r.repliedBy as DisplayUser) : null,
    repliedAt: r.repliedAt,
    createdAt: r.createdAt,
    courseInviteId: r.courseInviteId,
    courseTitle: r.courseInvite?.title ?? null,
  }))
}

// ── 後台：提問管理列表 ──
export type InquiryListItem = {
  id: number
  userId: string | null
  isSubmitterDeleted: boolean
  submitterName: string
  submitterSpiritId: string | null
  submitterRealName: string | null
  submitterGenderLabel: string
  submitterChurchLabel: string
  category: SupportInquiryCategory
  body: string
  status: SupportInquiryStatus
  replyBody: string | null
  repliedByName: string | null
  repliedAt: Date | null
  createdAt: Date
  courseInviteId: number | null
  courseTitle: string | null
}

export const INQUIRY_PAGE_SIZE = 20

const inquiryRowSelect = {
  id: true,
  userId: true,
  submitterName: true,
  submitterSpiritId: true,
  submitterRealName: true,
  submitterGenderLabel: true,
  submitterChurchLabel: true,
  category: true,
  body: true,
  status: true,
  replyBody: true,
  repliedAt: true,
  createdAt: true,
  courseInviteId: true,
  courseInvite: { select: { title: true } },
  user: { select: submitterSelect },
  repliedBy: { select: displaySelect },
} as const

type InquiryRow = Prisma.SupportInquiryGetPayload<{ select: typeof inquiryRowSelect }>

function buildInquiryWhere(opts: { status?: SupportInquiryStatus | 'all'; userId?: string }) {
  const status = opts.status ?? 'all'
  return {
    ...(status === 'all' ? {} : { status }),
    ...(opts.userId ? { userId: opts.userId } : {}),
  }
}

function mapInquiryRow(r: InquiryRow): InquiryListItem {
  return {
    id: r.id,
    userId: r.userId,
    isSubmitterDeleted: r.user === null,
    submitterName: r.user ? getMemberDisplayName(r.user as DisplayUser) : (r.submitterName ?? '（未填）'),
    submitterSpiritId: r.user ? r.user.spiritId : r.submitterSpiritId,
    submitterRealName: r.user ? r.user.realName : r.submitterRealName,
    submitterGenderLabel: r.user ? genderLabel(r.user.gender) : (r.submitterGenderLabel ?? '未設定'),
    submitterChurchLabel: r.user ? churchLabel(r.user) : (r.submitterChurchLabel ?? '—'),
    category: r.category,
    body: r.body,
    status: r.status,
    replyBody: r.replyBody,
    repliedByName: r.repliedBy ? getMemberDisplayName(r.repliedBy as DisplayUser) : null,
    repliedAt: r.repliedAt,
    createdAt: r.createdAt,
    courseInviteId: r.courseInviteId,
    courseTitle: r.courseInvite?.title ?? null,
  }
}

export async function getInquiryList(opts: {
  status?: SupportInquiryStatus | 'all'
  userId?: string
}): Promise<InquiryListItem[]> {
  const rows = await prisma.supportInquiry.findMany({
    where: buildInquiryWhere(opts),
    orderBy: { createdAt: 'desc' },
    select: inquiryRowSelect,
  })

  return rows.map(mapInquiryRow)
}

export async function getPaginatedInquiryList(opts: {
  status?: SupportInquiryStatus | 'all'
  page?: number
}): Promise<{ items: InquiryListItem[]; total: number; page: number; pageCount: number }> {
  const where = buildInquiryWhere(opts)
  const total = await prisma.supportInquiry.count({ where })
  const pageCount = Math.max(1, Math.ceil(total / INQUIRY_PAGE_SIZE))
  const safePage = Math.min(Math.max(1, opts.page ?? 1), pageCount)

  const rows = await prisma.supportInquiry.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    skip: (safePage - 1) * INQUIRY_PAGE_SIZE,
    take: INQUIRY_PAGE_SIZE,
    select: inquiryRowSelect,
  })

  return { items: rows.map(mapInquiryRow), total, page: safePage, pageCount }
}

// ── 後台：待處理提問數（儀錶板提示）──
export async function getPendingInquiryCount(): Promise<number> {
  return prisma.supportInquiry.count({ where: { status: 'pending' } })
}
