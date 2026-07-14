/*
 * ----------------------------------------------
 * Server Actions - 後台班級學員管理
 * 2026-07-14
 * app/actions/invite-students.ts
 *
 * 新增學員（掛既有帳號或建新帳號、可補登結業）、移除學員，
 * 皆於單一交易內完成並寫入管理操作紀錄（AdminActionLog）。
 * 不寄信、不發 Inbox 通知。
 * ----------------------------------------------
 */

'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { canAccessAdmin } from '@/lib/auth-roles'
import { createLoginableMember } from '@/lib/member-creation'
import { findMemberByEmail, type MemberByEmail } from '@/lib/data/invite-students'

type ActionResponse<T = undefined> = {
  success: boolean
  message?: string
  data?: T
  errors?: Record<string, string[]>
}

function fmtDate(d: Date): string {
  return d.toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

/** 操作紀錄快照：班級編號＋課程名稱 */
function inviteSnapshot(inviteId: number, title: string): string {
  return `#${inviteId} ${title}`
}

/** 操作紀錄快照：學員姓名（含 email） */
function targetSnapshot(realName: string | null, email: string): string {
  return `${realName ?? '（未填）'}（${email}）`
}

/**
 * 以 email 查既有會員（新增學員表單的確認列用）
 */
export async function lookupMemberByEmail(
  email: string
): Promise<ActionResponse<{ member: MemberByEmail | null }>> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, message: '請先登入' }
  if (!canAccessAdmin(session.user.roles)) return { success: false, message: '無權限' }

  const parsed = z.string().trim().toLowerCase().email().safeParse(email)
  if (!parsed.success) return { success: true, data: { member: null } }

  const member = await findMemberByEmail(parsed.data)
  return { success: true, data: { member } }
}

const addStudentSchema = z
  .object({
    inviteId: z.number().int().positive(),
    realName: z.string().trim().min(1, '請輸入姓名'),
    email: z.string().trim().toLowerCase().email('Email 格式不正確'),
    graduated: z.boolean().default(false),
    graduatedAt: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, '結業日格式不正確')
      .optional(),
  })
  .refine((v) => !v.graduated || !!v.graduatedAt, {
    message: '請選擇結業日',
    path: ['graduatedAt'],
  })

/**
 * 對班級新增學員：email 既有帳號→直接掛報名；查無→沿用後台新增會員機制建帳號
 * （spiritId＋臨時密碼＋白名單），臨時密碼一次性回傳供轉交。
 * 勾選已結業時 graduatedAt=joinedAt=結業日；班級未結業則同交易補 completedAt。
 */
export async function addStudentToInvite(input: {
  inviteId: number
  realName: string
  email: string
  graduated: boolean
  graduatedAt?: string
}): Promise<ActionResponse<{ tempPassword?: string; spiritId?: string }>> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, message: '請先登入' }
  if (!canAccessAdmin(session.user.roles)) return { success: false, message: '無權限' }

  const parsed = addStudentSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors }
  }
  const { inviteId, realName, email, graduated } = parsed.data
  const graduatedDate = graduated ? new Date(`${parsed.data.graduatedAt}T00:00:00`) : null

  const invite = await prisma.courseInvite.findUnique({
    where: { id: inviteId },
    select: { id: true, title: true, completedAt: true, cancelledAt: true },
  })
  if (!invite) return { success: false, message: '找不到此班級' }
  if (invite.cancelledAt) return { success: false, message: '已取消的班級無法新增學員' }

  // 操作管理者快照
  const actor = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { realName: true, name: true },
  })
  const actorName = actor?.realName || actor?.name || session.user.email || '管理者'

  // email 查既有帳號
  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true, realName: true },
  })

  // 重複報名事前檢查（unique 約束為最終防線）
  if (existingUser) {
    const dup = await prisma.inviteEnrollment.findUnique({
      where: { inviteId_userId: { inviteId, userId: existingUser.id } },
      select: { id: true },
    })
    if (dup) return { success: false, errors: { email: ['該學員已在此班級'] } }
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 掛既有帳號或建新帳號（不變更既有帳號資料）
      let userId: string
      let targetRealName: string | null
      let created: { tempPassword: string; spiritId: string } | undefined
      if (existingUser) {
        userId = existingUser.id
        targetRealName = existingUser.realName
      } else {
        const member = await createLoginableMember(tx, { realName, email, roles: ['user'] })
        userId = member.userId
        targetRealName = realName
        created = { tempPassword: member.tempPassword, spiritId: member.spiritId }
      }

      // 建立報名（補登結業時 joinedAt 對齊結業日，避免入班晚於結業）
      await tx.inviteEnrollment.create({
        data: {
          inviteId,
          userId,
          status: 'approved',
          ...(graduatedDate ? { joinedAt: graduatedDate, graduatedAt: graduatedDate } : {}),
        },
      })

      // 班級未結業而補登結業 → 一併補班級結業日
      if (graduatedDate && !invite.completedAt) {
        await tx.courseInvite.update({
          where: { id: inviteId },
          data: { completedAt: graduatedDate },
        })
      }

      // 管理操作紀錄（同交易；失敗全部回滾）
      await tx.adminActionLog.create({
        data: {
          action: 'enrollment_add',
          actorId: session.user.id,
          targetUserId: userId,
          inviteId,
          actorName,
          targetName: targetSnapshot(targetRealName, email),
          inviteTitle: inviteSnapshot(invite.id, invite.title),
          detail: [
            existingUser ? '掛既有帳號' : '建立新帳號',
            graduatedDate ? `補登結業 ${fmtDate(graduatedDate)}` : null,
            graduatedDate && !invite.completedAt ? '班級一併標記結業' : null,
          ]
            .filter(Boolean)
            .join('；'),
        },
      })

      return created
    })

    revalidatePath('/admin/course-sessions')
    revalidatePath(`/admin/course-sessions/${inviteId}/students`)
    return {
      success: true,
      message: existingUser ? '已將既有會員加入班級' : '已建立帳號並加入班級',
      data: result ? { tempPassword: result.tempPassword, spiritId: result.spiritId } : {},
    }
  } catch (err) {
    console.error('[addStudentToInvite] 新增失敗：', err)
    return { success: false, message: '新增失敗，請稍後再試' }
  }
}

/**
 * 自班級移除學員：實體刪除報名。
 * 有教材寄送項目關聯者拒絕；刪除與操作紀錄同交易。
 */
export async function removeStudentFromInvite(enrollmentId: number): Promise<ActionResponse> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, message: '請先登入' }
  if (!canAccessAdmin(session.user.roles)) return { success: false, message: '無權限' }

  const enrollment = await prisma.inviteEnrollment.findUnique({
    where: { id: enrollmentId },
    select: {
      id: true,
      graduatedAt: true,
      invite: { select: { id: true, title: true } },
      user: { select: { id: true, realName: true, email: true } },
      _count: { select: { shipmentItems: true } },
    },
  })
  if (!enrollment) return { success: false, message: '找不到此報名' }
  if (enrollment._count.shipmentItems > 0) {
    return { success: false, message: '該報名已有教材寄送紀錄，請先至教材管理處理' }
  }

  const actor = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { realName: true, name: true },
  })
  const actorName = actor?.realName || actor?.name || session.user.email || '管理者'

  try {
    await prisma.$transaction(async (tx) => {
      await tx.inviteEnrollment.delete({ where: { id: enrollmentId } })
      await tx.adminActionLog.create({
        data: {
          action: 'enrollment_remove',
          actorId: session.user.id,
          targetUserId: enrollment.user.id,
          inviteId: enrollment.invite.id,
          actorName,
          targetName: targetSnapshot(enrollment.user.realName, enrollment.user.email),
          inviteTitle: inviteSnapshot(enrollment.invite.id, enrollment.invite.title),
          detail: enrollment.graduatedAt
            ? `移除已結業報名（結業 ${fmtDate(enrollment.graduatedAt)}）`
            : '移除報名',
        },
      })
    })

    revalidatePath('/admin/course-sessions')
    revalidatePath(`/admin/course-sessions/${enrollment.invite.id}/students`)
    return { success: true, message: '已移除學員' }
  } catch (err) {
    console.error('[removeStudentFromInvite] 移除失敗：', err)
    return { success: false, message: '移除失敗，請稍後再試' }
  }
}
