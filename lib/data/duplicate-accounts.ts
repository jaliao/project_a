/*
 * ----------------------------------------------
 * 疑似重複帳號 — 資料層
 * 2026-10-16
 * lib/data/duplicate-accounts.ts
 *
 * 依 realName 精確分組，組內兩兩配對後依信心規則分級（最高／高／中），
 * 供後台「疑似重複帳號」頁面唯讀呈現。純查詢，不做任何寫入。
 * ----------------------------------------------
 */

import { prisma } from '@/lib/prisma'
import { isUndeliverableEmail } from '@/lib/mailer'
import { getMemberDisplayName } from '@/lib/utils/member-display'
import type { Gender, DisplayNameMode } from '@prisma/client'

export type DuplicateConfidence = '最高' | '高' | '中'

export type DuplicateCandidateSide = {
  id: string
  spiritId: string | null
  email: string
  displayName: string
  lastLoginAt: Date | null
  createdAt: Date
  enrollmentCount: number
  graduatedCount: number
}

export type DuplicateCandidate = {
  realName: string
  confidence: DuplicateConfidence
  a: DuplicateCandidateSide
  b: DuplicateCandidateSide
}

const CONFIDENCE_ORDER: Record<DuplicateConfidence, number> = { 最高: 0, 高: 1, 中: 2 }

type CandidateUser = {
  id: string
  spiritId: string | null
  email: string
  realName: string | null
  englishName: string | null
  nickname: string | null
  displayNameMode: DisplayNameMode
  phone: string | null
  commEmail: string | null
  churchId: number | null
  birthYear: number | null
  gender: Gender
  lastLoginAt: Date | null
  createdAt: Date
}

// 信心等級判斷：依序最高 → 高 → 中，一組配對只取最先命中者
function classify(a: CandidateUser, b: CandidateUser): DuplicateConfidence | null {
  if (isUndeliverableEmail(a.email) || isUndeliverableEmail(b.email)) return '最高'
  if ((a.phone && a.phone === b.phone) || (a.commEmail && a.commEmail === b.commEmail)) return '高'
  if (
    (a.churchId !== null && a.churchId === b.churchId) ||
    (a.birthYear !== null && a.birthYear === b.birthYear && a.gender === b.gender)
  ) {
    return '中'
  }
  return null
}

/**
 * 盤點疑似重複帳號配對：realName 完全相同且至少命中一項輔助訊號者，
 * 依信心等級（最高 → 高 → 中）排序回傳。純查詢，不寫入任何資料。
 */
export async function findDuplicateCandidates(): Promise<DuplicateCandidate[]> {
  const users = await prisma.user.findMany({
    where: { realName: { not: null } },
    select: {
      id: true,
      spiritId: true,
      email: true,
      realName: true,
      englishName: true,
      nickname: true,
      displayNameMode: true,
      phone: true,
      commEmail: true,
      churchId: true,
      birthYear: true,
      gender: true,
      lastLoginAt: true,
      createdAt: true,
    },
  })

  // 依 realName 精確分組，僅保留 size >= 2 的分組才需要兩兩配對
  const groups = new Map<string, CandidateUser[]>()
  for (const u of users) {
    const name = (u.realName ?? '').trim()
    if (!name) continue
    const list = groups.get(name)
    if (list) list.push(u)
    else groups.set(name, [u])
  }

  type Pair = { realName: string; confidence: DuplicateConfidence; a: CandidateUser; b: CandidateUser }
  const pairs: Pair[] = []
  for (const [realName, group] of groups) {
    if (group.length < 2) continue
    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        const confidence = classify(group[i], group[j])
        if (confidence) pairs.push({ realName, confidence, a: group[i], b: group[j] })
      }
    }
  }

  if (pairs.length === 0) return []

  // 報名／結業筆數：一次查詢所有涉及的 userId，避免逐筆配對各自查詢
  const userIds = [...new Set(pairs.flatMap((p) => [p.a.id, p.b.id]))]
  const enrollments = await prisma.inviteEnrollment.findMany({
    where: { userId: { in: userIds } },
    select: { userId: true, graduatedAt: true },
  })
  const enrollmentCount = new Map<string, number>()
  const graduatedCount = new Map<string, number>()
  for (const e of enrollments) {
    enrollmentCount.set(e.userId, (enrollmentCount.get(e.userId) ?? 0) + 1)
    if (e.graduatedAt) graduatedCount.set(e.userId, (graduatedCount.get(e.userId) ?? 0) + 1)
  }

  const toSide = (u: CandidateUser): DuplicateCandidateSide => ({
    id: u.id,
    spiritId: u.spiritId,
    email: u.email,
    displayName: getMemberDisplayName(u),
    lastLoginAt: u.lastLoginAt,
    createdAt: u.createdAt,
    enrollmentCount: enrollmentCount.get(u.id) ?? 0,
    graduatedCount: graduatedCount.get(u.id) ?? 0,
  })

  return pairs
    .map((p) => ({ realName: p.realName, confidence: p.confidence, a: toSide(p.a), b: toSide(p.b) }))
    .sort((x, y) => CONFIDENCE_ORDER[x.confidence] - CONFIDENCE_ORDER[y.confidence])
}
