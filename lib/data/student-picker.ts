/*
 * ----------------------------------------------
 * Data Layer - 學員選擇元件（通用單選挑人）
 * 2026-09-16
 * lib/data/student-picker.ts
 *
 * cr-spec-260916-004：searchStudentCandidates 以啟動編號／姓名／暱稱／
 * 登入 Email 模糊搜尋既有會員，標記呼叫者好友並排序（好友優先），
 * 支援排除指定 userId 清單。授權範圍由呼叫端的 Server Action 負責。
 * ----------------------------------------------
 */

import { prisma } from '@/lib/prisma'
import { getMemberDisplayName } from '@/lib/utils/member-display'
import { resolveAvatarUrl } from '@/lib/utils/avatar'

export type StudentPickerCandidate = {
  userId: string
  spiritId: string | null
  displayName: string
  avatarUrl: string | null
  email: string
  isFriend: boolean
}

const CANDIDATE_LIMIT = 20
const QUERY_TAKE = 30

/**
 * 以啟動編號／姓名（realName／name）／暱稱／登入 Email 模糊搜尋既有會員，
 * 排除 currentUserId 與呼叫端指定的 excludeUserIds，結果標記是否為呼叫者好友並排序（好友優先）。
 */
export async function searchStudentCandidates(
  currentUserId: string,
  query: string,
  excludeUserIds: string[]
): Promise<StudentPickerCandidate[]> {
  const q = query.trim()
  if (!q) return []

  const users = await prisma.user.findMany({
    where: {
      id: { notIn: [...excludeUserIds, currentUserId] },
      OR: [
        { realName: { contains: q, mode: 'insensitive' } },
        { name: { contains: q, mode: 'insensitive' } },
        { nickname: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { spiritId: { contains: q, mode: 'insensitive' } },
      ],
    },
    orderBy: [{ realName: 'asc' }],
    take: QUERY_TAKE,
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

  if (users.length === 0) return []

  const friendRows = await prisma.friendship.findMany({
    where: { ownerId: currentUserId, friendId: { in: users.map((u) => u.id) } },
    select: { friendId: true },
  })
  const friendIds = new Set(friendRows.map((f) => f.friendId))

  const candidates: StudentPickerCandidate[] = users.map((u) => ({
    userId: u.id,
    spiritId: u.spiritId,
    displayName: getMemberDisplayName(u),
    avatarUrl: resolveAvatarUrl(u),
    email: u.email,
    isFriend: friendIds.has(u.id),
  }))

  // 好友優先排序（穩定排序，組內維持查詢原順序）
  candidates.sort((a, b) => Number(b.isFriend) - Number(a.isFriend))

  return candidates.slice(0, CANDIDATE_LIMIT)
}
