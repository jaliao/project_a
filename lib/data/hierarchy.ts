/*
 * ----------------------------------------------
 * Data Layer - 會員學習階層查詢
 * 2026-04-02
 * lib/data/hierarchy.ts
 *
 * 師生關係定義（僅限啟動靈人 courseCatalogId = 1）：
 * - 老師：帶領此會員完成啟動靈人的 CourseInvite.createdBy
 * - 學生：此會員建立的 CourseInvite 中已結業的 InviteEnrollment.user
 * 只計算 graduatedAt IS NOT NULL 的結業紀錄
 * ----------------------------------------------
 */

import { prisma } from '@/lib/prisma'

const SPIRIT_COURSE_ID = 1 // 啟動靈人

export type HierarchyNode = {
  id: string
  realName: string | null
  englishName: string | null
  nickname: string | null
  name: string | null
  displayNameMode: 'chinese' | 'english' | null
  spiritId: string | null
  children: HierarchyNode[]
}

type MemberRef = {
  id: string
  realName: string | null
  englishName: string | null
  nickname: string | null
  name: string | null
  displayNameMode: 'chinese' | 'english' | null
  spiritId: string | null
}

export type MemberHierarchy = {
  teacher: MemberRef | null
  root: HierarchyNode
}

// ==========================================
// 取得指定會員的師生傳承樹
// ==========================================
export async function getMemberHierarchy(userId: string, depth: number): Promise<MemberHierarchy> {
  // ── 取得根節點資料 ──────────────────────────
  const rootUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, realName: true, englishName: true, nickname: true, name: true, displayNameMode: true, spiritId: true },
  })

  // ── 查老師：此會員在啟動靈人已結業的 enrollment，其 invite.createdBy 即為老師 ──
  const teacherEnrollment = await prisma.inviteEnrollment.findFirst({
    where: {
      userId,
      graduatedAt: { not: null },
      invite: { courseCatalogId: SPIRIT_COURSE_ID },
    },
    orderBy: { graduatedAt: 'asc' }, // 取最早結業那次
    select: {
      invite: {
        select: {
          createdBy: {
            select: { id: true, realName: true, englishName: true, nickname: true, name: true, displayNameMode: true, spiritId: true },
          },
        },
      },
    },
  })

  const teacher = teacherEnrollment?.invite.createdBy ?? null

  // ── BFS 展開學生樹 ──────────────────────────
  const root: HierarchyNode = {
    id: rootUser?.id ?? userId,
    realName: rootUser?.realName ?? null,
    englishName: rootUser?.englishName ?? null,
    nickname: rootUser?.nickname ?? null,
    name: rootUser?.name ?? null,
    displayNameMode: rootUser?.displayNameMode ?? null,
    spiritId: rootUser?.spiritId ?? null,
    children: [],
  }

  // BFS queue：[node, currentDepth]
  const queue: Array<[HierarchyNode, number]> = [[root, 1]]

  while (queue.length > 0) {
    const [node, currentDepth] = queue.shift()!
    if (currentDepth > depth) break

    // 找此節點帶領並結業的學生
    const enrollments = await prisma.inviteEnrollment.findMany({
      where: {
        graduatedAt: { not: null },
        invite: {
          courseCatalogId: SPIRIT_COURSE_ID,
          createdById: node.id,
        },
      },
      take: 200,
      select: {
        user: {
          select: { id: true, realName: true, englishName: true, nickname: true, name: true, displayNameMode: true, spiritId: true },
        },
      },
    })

    // 去重（同一學生可能在多個班次結業）
    const seen = new Set<string>()
    for (const { user } of enrollments) {
      if (seen.has(user.id)) continue
      seen.add(user.id)

      const childNode: HierarchyNode = {
        id: user.id,
        realName: user.realName,
        englishName: user.englishName,
        nickname: user.nickname,
        name: user.name,
        displayNameMode: user.displayNameMode,
        spiritId: user.spiritId,
        children: [],
      }
      node.children.push(childNode)

      if (currentDepth < depth) {
        queue.push([childNode, currentDepth + 1])
      }
    }
  }

  return { teacher, root }
}
