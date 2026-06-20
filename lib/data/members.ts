/*
 * ----------------------------------------------
 * Data Layer - 會員管理
 * 2026-04-01
 * lib/data/members.ts
 * ----------------------------------------------
 */

import { prisma } from '@/lib/prisma'
import type { Gender, UserRole, Prisma } from '@prisma/client'

// 會員清單每頁筆數
export const MEMBER_PAGE_SIZE = 30

// 會員篩選條件（church：churchId 數字字串 / 'other' / 'none'）
export type MemberFilters = {
  q?: string
  gender?: Gender
  role?: UserRole
  church?: string
}

// 是否有任何篩選/搜尋條件
export function hasAnyMemberFilter(f: MemberFilters): boolean {
  return !!(f.q?.trim() || f.gender || f.role || f.church)
}

// 由篩選條件組出 Prisma where（AND 組合）
export function buildMemberWhere(f: MemberFilters): Prisma.UserWhereInput {
  const and: Prisma.UserWhereInput[] = []

  if (f.q?.trim()) {
    const q = f.q.trim()
    and.push({
      OR: [
        { realName: { contains: q, mode: 'insensitive' } },
        { name: { contains: q, mode: 'insensitive' } },
        { nickname: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { spiritId: { contains: q, mode: 'insensitive' } },
      ],
    })
  }
  if (f.gender) and.push({ gender: f.gender })
  if (f.role) and.push({ roles: { has: f.role } })
  if (f.church) {
    if (f.church === 'other') and.push({ churchType: 'other' })
    else if (f.church === 'none') and.push({ churchType: 'none' })
    else {
      const id = Number(f.church)
      if (!Number.isNaN(id)) and.push({ churchId: id })
    }
  }

  return and.length ? { AND: and } : {}
}

// ==========================================
// 搜尋會員清單（分頁）
// ==========================================
export async function searchMembers(f: MemberFilters, page = 1) {
  const where = buildMemberWhere(f)
  const total = await prisma.user.count({ where })
  const pageCount = Math.max(1, Math.ceil(total / MEMBER_PAGE_SIZE))
  const safePage = Math.min(Math.max(1, page), pageCount)

  const items = await prisma.user.findMany({
    where,
    orderBy: [{ createdAt: 'desc' }, { realName: 'asc' }],
    skip: (safePage - 1) * MEMBER_PAGE_SIZE,
    take: MEMBER_PAGE_SIZE,
    select: {
      id: true,
      name: true,
      realName: true,
      englishName: true,
      nickname: true,
      email: true,
      spiritId: true,
      roles: true,
      displayNameMode: true,
      createdAt: true,
    },
  })

  return { total, items, page: safePage, pageCount }
}

// ==========================================
// 取得單一會員詳情（含學習與授課紀錄）
// ==========================================
export async function getMemberDetail(id: string) {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      realName: true,
      englishName: true,
      nickname: true,
      email: true,
      spiritId: true,
      roles: true,
      teacherNo: true,
      gender: true,
      displayNameMode: true,
      createdAt: true,
      churchType: true,
      churchOther: true,
      church: { select: { name: true } },
      // 學習紀錄：參加的課程（已開始）
      inviteEnrollments: {
        where: {
          invite: { startedAt: { not: null } },
        },
        select: {
          graduatedAt: true,
          teacherRecommended: true,
          teacherFeedbackNote: true,
          invite: {
            select: {
              id: true,
              title: true,
              startedAt: true,
              courseCatalogId: true,
              courseCatalog: { select: { label: true } },
              createdBy: {
                select: {
                  realName: true,
                  name: true,
                  englishName: true,
                  nickname: true,
                  displayNameMode: true,
                },
              },
            },
          },
        },
      },
      // 授課紀錄：自己建立的課程（已開始）
      courseInvites: {
        where: { startedAt: { not: null } },
        select: {
          id: true,
          title: true,
          startedAt: true,
          courseCatalog: { select: { label: true } },
        },
        orderBy: { startedAt: 'desc' },
      },
    },
  })
}

export type MemberDetail = NonNullable<Awaited<ReturnType<typeof getMemberDetail>>>

// ==========================================
// 匯出會員資料（完整欄位）
// ==========================================
export async function exportMembers(f: MemberFilters = {}) {
  const where = buildMemberWhere(f)

  return prisma.user.findMany({
    where,
    orderBy: [{ createdAt: 'desc' }, { realName: 'asc' }],
    select: {
      spiritId: true,
      realName: true,
      englishName: true,
      nickname: true,
      email: true,
      commEmail: true,
      phone: true,
      gender: true,
      roles: true,
      teacherNo: true,
      church: { select: { name: true } },
      churchOther: true,
      churchType: true,
      learningLevel: true,
      createdAt: true,
      lastLoginAt: true,
    },
  })
}
