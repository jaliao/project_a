/*
 * ----------------------------------------------
 * Data Layer - 老師選擇（轉移班級用，通用單選挑人）
 * 2026-10-05
 * lib/data/teacher-picker.ts
 *
 * cr-feat-261005-001：searchTeacherCandidates 依「必須同時具備的書籍講師身分」
 * （hasEvery）過濾候選老師，供「轉移班級」Dialog 重用 StudentPicker 元件殼時
 * 當作 onSearch 查詢。刻意不吃 admin/superadmin override——轉移目標必須實際
 * 持有對應書籍講師身分（理由見 cr-feat-261005-001 design.md 決策 2）。
 * ----------------------------------------------
 */

import { prisma } from '@/lib/prisma'
import { getMemberDisplayName } from '@/lib/utils/member-display'
import { resolveAvatarUrl } from '@/lib/utils/avatar'
import type { TeacherRole } from '@/lib/auth-roles'

export type TeacherPickerCandidate = {
  userId: string
  spiritId: string | null
  displayName: string
  avatarUrl: string | null
  email: string | null
}

const CANDIDATE_LIMIT = 20

/**
 * 以啟動編號／姓名（realName／name）／暱稱／登入 Email 模糊搜尋，僅回傳同時具備
 * requiredRoles 全部身分的使用者（不套用管理者 override）。requiredRoles 為空時
 * 直接回傳空陣列（避免誤回傳未過濾的全體會員）。
 */
export async function searchTeacherCandidates(
  requiredRoles: TeacherRole[],
  query: string,
  excludeUserIds: string[]
): Promise<TeacherPickerCandidate[]> {
  const q = query.trim()
  if (!q || requiredRoles.length === 0) return []

  const users = await prisma.user.findMany({
    where: {
      id: { notIn: excludeUserIds },
      roles: { hasEvery: requiredRoles },
      OR: [
        { realName: { contains: q, mode: 'insensitive' } },
        { name: { contains: q, mode: 'insensitive' } },
        { nickname: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { spiritId: { contains: q, mode: 'insensitive' } },
      ],
    },
    orderBy: [{ realName: 'asc' }],
    take: CANDIDATE_LIMIT,
    select: {
      id: true,
      spiritId: true,
      email: true,
      avatarKey: true,
      image: true,
      realName: true,
      englishName: true,
      nickname: true,
      displayNameMode: true,
    },
  })

  return users.map((u) => ({
    userId: u.id,
    spiritId: u.spiritId,
    displayName: getMemberDisplayName(u),
    avatarUrl: resolveAvatarUrl(u),
    email: u.email,
  }))
}
