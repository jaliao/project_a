/*
 * ----------------------------------------------
 * Data Layer - 後台班級學員管理查詢
 * 2026-07-14
 * lib/data/invite-students.ts
 * ----------------------------------------------
 */

import { prisma } from '@/lib/prisma'
import { getMemberDisplayName, type DisplayNameMode } from '@/lib/utils/member-display'

export type InviteStudentItem = {
  enrollmentId: number
  userId: string
  realName: string | null
  englishName: string | null
  displayName: string
  spiritId: string | null
  email: string
  status: 'pending' | 'approved'
  graduatedAt: Date | null
  shipmentItemCount: number
}

export type InviteStudentsAdmin = {
  invite: {
    id: number
    title: string
    courseCatalogLabel: string
    instructorName: string
    startedAt: Date | null
    cancelledAt: Date | null
    completedAt: Date | null
  }
  students: InviteStudentItem[]
}

/**
 * 取得班級資訊與全部報名學員（後台班級學員管理頁用）
 */
export async function getInviteStudentsAdmin(inviteId: number): Promise<InviteStudentsAdmin | null> {
  const invite = await prisma.courseInvite.findUnique({
    where: { id: inviteId },
    select: {
      id: true,
      title: true,
      courseCatalog: { select: { label: true } },
      startedAt: true,
      cancelledAt: true,
      completedAt: true,
      createdBy: { select: { realName: true, name: true } },
      enrollments: {
        orderBy: { joinedAt: 'asc' },
        select: {
          id: true,
          status: true,
          graduatedAt: true,
          user: {
            select: {
              id: true,
              email: true,
              realName: true,
              englishName: true,
              nickname: true,
              displayNameMode: true,
              spiritId: true,
            },
          },
          _count: { select: { shipmentItems: true } },
        },
      },
    },
  })
  if (!invite) return null

  return {
    invite: {
      id: invite.id,
      title: invite.title,
      courseCatalogLabel: invite.courseCatalog.label,
      instructorName: invite.createdBy.realName || invite.createdBy.name || '講師',
      startedAt: invite.startedAt,
      cancelledAt: invite.cancelledAt,
      completedAt: invite.completedAt,
    },
    students: invite.enrollments.map((e) => ({
      enrollmentId: e.id,
      userId: e.user.id,
      realName: e.user.realName,
      englishName: e.user.englishName,
      displayName: getMemberDisplayName({
        realName: e.user.realName,
        englishName: e.user.englishName,
        nickname: e.user.nickname,
        displayNameMode: e.user.displayNameMode as DisplayNameMode,
      }),
      spiritId: e.user.spiritId,
      email: e.user.email,
      status: e.status as 'pending' | 'approved',
      graduatedAt: e.graduatedAt,
      shipmentItemCount: e._count.shipmentItems,
    })),
  }
}

export type MemberByEmail = {
  userId: string
  realName: string | null
  displayName: string
  spiritId: string | null
}

/**
 * 以 email（不分大小寫）查既有會員（新增學員表單確認列用）
 */
export async function findMemberByEmail(email: string): Promise<MemberByEmail | null> {
  const user = await prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
    select: {
      id: true,
      realName: true,
      englishName: true,
      nickname: true,
      displayNameMode: true,
      spiritId: true,
    },
  })
  if (!user) return null
  return {
    userId: user.id,
    realName: user.realName,
    displayName: getMemberDisplayName({
      realName: user.realName,
      englishName: user.englishName,
      nickname: user.nickname,
      displayNameMode: user.displayNameMode as DisplayNameMode,
    }),
    spiritId: user.spiritId,
  }
}
