/*
 * ----------------------------------------------
 * Data Layer - 實體結業證書製作清單
 * 2026-07-01 (Updated: 2026-07-14)
 * lib/data/certificate.ts
 *
 * 證書單位＝每人每階層一張（userId × courseCatalogId）：
 * 由已結業報名（graduatedAt 不為 null）去重（取最新結業日），
 * 左接 CertificateProduction 取製作狀態/日期/管理者/備註。
 * 附身分確認欄位（真實姓名中英/性別/單位）供管理者核對證書姓名。
 * ----------------------------------------------
 */

import { prisma } from '@/lib/prisma'
import { getMemberDisplayName, type DisplayNameMode } from '@/lib/utils/member-display'
import { resolveAvatarUrl } from '@/lib/utils/avatar'
import type { MemberTagInfo } from '@/components/admin/member-tag'
import type { Gender } from '@/components/shared/gender-icon'

const PAGE_SIZE = 30

// 顯示名稱所需欄位
const displaySelect = {
  realName: true,
  englishName: true,
  nickname: true,
  displayNameMode: true,
} as const

export type CertificateStatus = 'pending' | 'done'

export type CertificateListItem = {
  userId: string
  courseCatalogId: number
  courseCatalogLabel: string
  displayName: string
  realName: string | null
  englishName: string | null
  gender: Gender
  churchLabel: string | null
  spiritId: string | null
  graduatedAt: Date
  producedAt: Date | null
  producedByName: string | null
  note: string | null
  member: MemberTagInfo
  teacher: MemberTagInfo
}

export type CertificateListResult = {
  items: CertificateListItem[]
  total: number
  totalPages: number
  page: number
  pageSize: number
}

type DisplayUser = {
  realName: string | null
  englishName: string | null
  nickname: string | null
  displayNameMode: DisplayNameMode
}

export async function getCertificateProductionList(opts: {
  status?: CertificateStatus
  q?: string
  page?: number
}): Promise<CertificateListResult> {
  const status: CertificateStatus = opts.status === 'done' ? 'done' : 'pending'
  const q = (opts.q ?? '').trim()
  const page = Math.max(1, opts.page ?? 1)

  // 1) 全部已結業報名 → 依 (userId, courseCatalogId) 去重（取最新結業日）
  const enrollments = await prisma.inviteEnrollment.findMany({
    where: { graduatedAt: { not: null } },
    select: {
      graduatedAt: true,
      user: {
        select: {
          id: true,
          spiritId: true,
          gender: true,
          churchType: true,
          churchOther: true,
          church: { select: { name: true } },
          roles: true,
          avatarKey: true,
          image: true,
          ...displaySelect,
        },
      },
      invite: {
        select: {
          courseCatalogId: true,
          courseCatalog: { select: { label: true } },
          createdBy: {
            select: {
              id: true,
              spiritId: true,
              roles: true,
              realName: true,
              name: true,
              email: true,
              nickname: true,
              englishName: true,
              displayNameMode: true,
              avatarKey: true,
              image: true,
              gender: true,
              church: { select: { name: true } },
              churchOther: true,
            },
          },
        },
      },
    },
  })

  type EligibleUser = DisplayUser & { roles: string[]; avatarKey: string | null; image: string | null }

  type Eligible = {
    userId: string
    courseCatalogId: number
    courseCatalogLabel: string
    user: EligibleUser
    gender: Gender
    churchLabel: string | null
    spiritId: string | null
    graduatedAt: Date
    teacher: MemberTagInfo
  }
  const eligible = new Map<string, Eligible>()
  for (const e of enrollments) {
    const key = `${e.user.id}:${e.invite.courseCatalogId}`
    const prev = eligible.get(key)
    if (!prev || e.graduatedAt! > prev.graduatedAt) {
      const teacherUser = e.invite.createdBy
      eligible.set(key, {
        userId: e.user.id,
        courseCatalogId: e.invite.courseCatalogId,
        courseCatalogLabel: e.invite.courseCatalog.label,
        user: e.user,
        gender: e.user.gender,
        // 單位：清單教會名 → 自填其他 → 無（比照會員匯出解析順序）
        churchLabel: e.user.church?.name ?? e.user.churchOther ?? null,
        spiritId: e.user.spiritId,
        graduatedAt: e.graduatedAt!,
        teacher: {
          id: teacherUser.id,
          spiritId: teacherUser.spiritId,
          roles: teacherUser.roles,
          displayName: getMemberDisplayName(teacherUser),
          realName: teacherUser.realName ?? null,
          gender: teacherUser.gender,
          churchLabel: teacherUser.church?.name ?? teacherUser.churchOther ?? null,
          avatarUrl: resolveAvatarUrl(teacherUser),
        },
      })
    }
  }

  // 2) 左接製作紀錄
  const productions = await prisma.certificateProduction.findMany({
    select: {
      userId: true,
      courseCatalogId: true,
      producedAt: true,
      note: true,
      producedBy: { select: displaySelect },
    },
  })
  const prodMap = new Map(productions.map((p) => [`${p.userId}:${p.courseCatalogId}`, p]))

  // 3) 組列
  let rows: CertificateListItem[] = [...eligible.values()].map((c) => {
    const p = prodMap.get(`${c.userId}:${c.courseCatalogId}`)
    return {
      userId: c.userId,
      courseCatalogId: c.courseCatalogId,
      courseCatalogLabel: c.courseCatalogLabel,
      displayName: getMemberDisplayName(c.user),
      realName: c.user.realName ?? null,
      englishName: c.user.englishName ?? null,
      gender: c.gender,
      churchLabel: c.churchLabel,
      spiritId: c.spiritId,
      graduatedAt: c.graduatedAt,
      producedAt: p?.producedAt ?? null,
      producedByName: p?.producedBy ? getMemberDisplayName(p.producedBy) : null,
      note: p?.note ?? null,
      member: {
        id: c.userId,
        spiritId: c.spiritId,
        roles: c.user.roles,
        displayName: getMemberDisplayName(c.user),
        realName: c.user.realName ?? null,
        gender: c.gender,
        churchLabel: c.churchLabel,
        avatarUrl: resolveAvatarUrl(c.user),
      },
      teacher: c.teacher,
    }
  })

  // 4) 狀態篩選（未完成＝producedAt 為 null；已完成＝not null）
  rows = rows.filter((r) => (status === 'done' ? r.producedAt != null : r.producedAt == null))

  // 5) 人名搜尋（真實姓名中/英、顯示名稱、啟動編號）
  if (q) {
    const qLower = q.toLowerCase()
    rows = rows.filter(
      (r) =>
        (r.realName ?? '').includes(q) ||
        (r.englishName ?? '').toLowerCase().includes(qLower) ||
        r.displayName.includes(q) ||
        (r.spiritId ?? '').toLowerCase().includes(qLower)
    )
  }

  // 6) 排序：未完成→結業日舊到新（優先待製作）；已完成→製作日新到舊
  rows.sort((a, b) =>
    status === 'done'
      ? (b.producedAt!.getTime() - a.producedAt!.getTime())
      : (a.graduatedAt.getTime() - b.graduatedAt.getTime())
  )

  const total = rows.length
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const items = rows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  return { items, total, totalPages, page: safePage, pageSize: PAGE_SIZE }
}
