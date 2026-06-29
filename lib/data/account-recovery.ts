/*
 * ----------------------------------------------
 * 找回帳號 — 資料層
 * 2026-06-29
 * lib/data/account-recovery.ts
 *
 * 提供：未啟用帳號查詢、身分驗證選擇題出題、未啟用會員清單。
 * 「未啟用」＝ 從未登入過（lastLoginAt 為 null）且仍為臨時密碼（isTempPassword=true）。
 * ----------------------------------------------
 */

import { prisma } from '@/lib/prisma'
import { getMemberDisplayName } from '@/lib/utils/member-display'

// 顯示名稱所需欄位
const DISPLAY_SELECT = {
  id: true,
  realName: true,
  englishName: true,
  nickname: true,
  displayNameMode: true,
} as const

export type RecoverableAccount = {
  id: string
  email: string
}

// 選擇題：一個選項
export type QuestionOption = { id: string; name: string }
// 出題結果
export type RecoveryQuestion = {
  type: 'teacher' | 'classmate'
  prompt: string
  correctId: string
  options: QuestionOption[]
}

/**
 * 以中文名字（trim 後精確比對）在「未啟用帳號」中查詢。
 * 回傳符合的帳號清單（呼叫端依 0／1／多筆分流）。
 */
export async function findInactiveByRealName(realName: string): Promise<RecoverableAccount[]> {
  const name = realName.trim()
  if (!name) return []
  const users = await prisma.user.findMany({
    where: {
      realName: name,
      lastLoginAt: null,
      isTempPassword: true,
    },
    select: { id: true, email: true },
  })
  return users.map((u) => ({ id: u.id, email: u.email }))
}

// Fisher–Yates 洗牌
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/**
 * 依帳號的報名資料出一題身分驗證選擇題（4 選 1）。
 * - 老師題：正解為其報名課程的建立者（授課老師）。
 * - 同學題：正解為同班其他報名者。
 * 誘答取自與該帳號課程無關的其他會員。資料不足時回傳 null。
 */
export async function buildRecoveryQuestion(accountId: string): Promise<RecoveryQuestion | null> {
  const enrollments = await prisma.inviteEnrollment.findMany({
    where: { userId: accountId },
    include: {
      invite: {
        select: {
          createdById: true,
          createdBy: { select: DISPLAY_SELECT },
          enrollments: { select: { user: { select: DISPLAY_SELECT } } },
        },
      },
    },
  })

  if (enrollments.length === 0) return null

  // 老師候選（課程建立者，排除帳號本人）
  const teachers = new Map<string, QuestionOption>()
  // 同學候選（同班其他報名者，排除帳號本人與老師）
  const classmates = new Map<string, QuestionOption>()
  const relatedIds = new Set<string>([accountId])

  for (const e of enrollments) {
    const teacher = e.invite.createdBy
    if (teacher.id !== accountId) {
      teachers.set(teacher.id, { id: teacher.id, name: getMemberDisplayName(teacher) })
      relatedIds.add(teacher.id)
    }
    for (const cm of e.invite.enrollments) {
      const u = cm.user
      if (u.id !== accountId) {
        relatedIds.add(u.id)
        if (u.id !== teacher.id) {
          classmates.set(u.id, { id: u.id, name: getMemberDisplayName(u) })
        }
      }
    }
  }

  // 優先老師題，無老師才用同學題
  const useTeacher = teachers.size > 0
  const pool = useTeacher ? [...teachers.values()] : [...classmates.values()]
  if (pool.length === 0) return null

  const correct = pool[Math.floor(Math.random() * pool.length)]

  // 誘答：與該帳號課程無關的其他會員
  const distractorUsers = await prisma.user.findMany({
    where: {
      id: { notIn: [...relatedIds] },
      realName: { not: null },
    },
    select: DISPLAY_SELECT,
    take: 30,
  })
  const distractors = shuffle(distractorUsers.map((u) => ({ id: u.id, name: getMemberDisplayName(u) })))
    .slice(0, 3)

  // 至少要能湊到 1 個誘答才有鑑別度
  if (distractors.length === 0) return null

  const options = shuffle([correct, ...distractors])
  return {
    type: useTeacher ? 'teacher' : 'classmate',
    prompt: useTeacher ? '下列哪一位是你的授課老師？' : '下列哪一位是你的同學？',
    correctId: correct.id,
    options,
  }
}

// 未啟用會員清單（後台用）
export type InactiveMember = {
  id: string
  spiritId: string | null
  email: string
  displayName: string
  roles: string[]
  isTempPassword: boolean
  createdAt: Date
}

/**
 * 後台：列出從未登入過（lastLoginAt 為 null）的會員。
 */
export async function listInactiveMembers(): Promise<InactiveMember[]> {
  const users = await prisma.user.findMany({
    where: { lastLoginAt: null },
    select: {
      ...DISPLAY_SELECT,
      spiritId: true,
      email: true,
      roles: true,
      isTempPassword: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  })
  return users.map((u) => ({
    id: u.id,
    spiritId: u.spiritId,
    email: u.email,
    displayName: getMemberDisplayName(u),
    roles: u.roles,
    isTempPassword: u.isTempPassword,
    createdAt: u.createdAt,
  }))
}
