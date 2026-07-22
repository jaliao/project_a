/*
 * ----------------------------------------------
 * Data Layer - 聯繫管理者（學員提問）
 * 2026-07-22
 * lib/data/support-inquiry.ts
 * ----------------------------------------------
 */

import { prisma } from '@/lib/prisma'
import { getMemberDisplayName, type DisplayNameMode } from '@/lib/utils/member-display'
import type { SupportInquiryCategory, SupportInquiryStatus } from '@prisma/client'

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
  }))
}

// ── 後台：提問管理列表 ──
export type InquiryListItem = {
  id: number
  userId: string
  submitterName: string
  submitterSpiritId: string | null
  category: SupportInquiryCategory
  body: string
  status: SupportInquiryStatus
  replyBody: string | null
  repliedByName: string | null
  repliedAt: Date | null
  createdAt: Date
}

export async function getInquiryList(opts: {
  status?: SupportInquiryStatus | 'all'
}): Promise<InquiryListItem[]> {
  const status = opts.status ?? 'all'
  const where = status === 'all' ? {} : { status }

  const rows = await prisma.supportInquiry.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      userId: true,
      category: true,
      body: true,
      status: true,
      replyBody: true,
      repliedAt: true,
      createdAt: true,
      user: { select: { spiritId: true, ...displaySelect } },
      repliedBy: { select: displaySelect },
    },
  })

  return rows.map((r) => ({
    id: r.id,
    userId: r.userId,
    submitterName: getMemberDisplayName(r.user as DisplayUser),
    submitterSpiritId: r.user.spiritId,
    category: r.category,
    body: r.body,
    status: r.status,
    replyBody: r.replyBody,
    repliedByName: r.repliedBy ? getMemberDisplayName(r.repliedBy as DisplayUser) : null,
    repliedAt: r.repliedAt,
    createdAt: r.createdAt,
  }))
}

// ── 後台：待處理提問數（儀錶板提示）──
export async function getPendingInquiryCount(): Promise<number> {
  return prisma.supportInquiry.count({ where: { status: 'pending' } })
}
