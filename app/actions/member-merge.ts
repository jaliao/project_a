/*
 * ----------------------------------------------
 * Server Actions - 合併帳號
 * 2026-10-16
 * app/actions/member-merge.ts
 *
 * 管理者將兩筆帳號（主／副）合併：副帳號的關聯資料改指向主帳號，
 * 副帳號標記 mergedIntoId／mergedAt／mergedById 但不刪除（殘影保留），
 * 自此無法再登入（見 lib/auth.ts、app/(user)/layout.tsx 的登入阻擋檢查）。
 * ----------------------------------------------
 */

'use server'

import { revalidatePath } from 'next/cache'
import { Prisma } from '@prisma/client'
import type { UserRole, Gender, ChurchType } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { canAccessAdmin } from '@/lib/auth-roles'
import { isUndeliverableEmail, sendAccountMergedNotification } from '@/lib/mailer'
import { resolveContactEmail } from '@/lib/utils/contact-email'
import { searchStudentCandidates, type StudentPickerCandidate } from '@/lib/data/student-picker'

type ActionResponse<T = undefined> = {
  success: boolean
  message?: string
  data?: T
}

// 預覽／合併皆需要的帳號基本欄位
const PROFILE_SELECT = {
  id: true,
  spiritId: true,
  email: true,
  commEmail: true,
  isCommVerified: true,
  realName: true,
  nickname: true,
  englishName: true,
  displayNameMode: true,
  roles: true,
  learningLevel: true,
  phone: true,
  churchType: true,
  churchId: true,
  churchOther: true,
  gender: true,
  birthYear: true,
  teacherNo: true,
  mergedIntoId: true,
} satisfies Parameters<typeof prisma.user.findUnique>[0]['select']

type ProfileRow = NonNullable<Awaited<ReturnType<typeof fetchProfile>>>

async function fetchProfile(id: string) {
  return prisma.user.findUnique({ where: { id }, select: PROFILE_SELECT })
}

export type MergeAccountSummary = {
  id: string
  spiritId: string | null
  displayName: string
  email: string
  roles: UserRole[]
  learningLevel: number
  isUndeliverableEmail: boolean
}

function toSummary(u: ProfileRow): MergeAccountSummary {
  const displayName = u.nickname || u.realName || u.englishName || '（未填）'
  return {
    id: u.id,
    spiritId: u.spiritId,
    displayName,
    email: u.email,
    roles: u.roles,
    learningLevel: u.learningLevel,
    isUndeliverableEmail: isUndeliverableEmail(u.email),
  }
}

// 依 isUndeliverableEmail 判斷建議的副帳號 id；雙方皆為/皆非合成信箱時回傳 null（需手動指定）
function suggestSecondary(a: { id: string; email: string }, b: { id: string; email: string }): string | null {
  const aSeed = isUndeliverableEmail(a.email)
  const bSeed = isUndeliverableEmail(b.email)
  if (aSeed && !bSeed) return a.id
  if (bSeed && !aSeed) return b.id
  return null
}

export type ProfileFillIn = { field: string; label: string; value: string }

// 主帳號缺漏欄位由副帳號補值：僅補空值，不覆蓋主帳號既有值
function computeProfileFillIns(primary: ProfileRow, secondary: ProfileRow) {
  const updates: {
    phone?: string
    churchType?: ChurchType
    churchId?: number | null
    churchOther?: string | null
    englishName?: string
    gender?: Gender
    birthYear?: number
    teacherNo?: string
  } = {}
  const fillIns: ProfileFillIn[] = []

  if (!primary.phone && secondary.phone) {
    updates.phone = secondary.phone
    fillIns.push({ field: 'phone', label: '電話', value: secondary.phone })
  }
  if (primary.churchType === 'none' && secondary.churchType !== 'none') {
    updates.churchType = secondary.churchType
    updates.churchId = secondary.churchId
    updates.churchOther = secondary.churchOther
    fillIns.push({
      field: 'church',
      label: '教會',
      value: secondary.churchType === 'other' ? (secondary.churchOther ?? '其他') : '教會資料',
    })
  }
  if (!primary.englishName && secondary.englishName) {
    updates.englishName = secondary.englishName
    fillIns.push({ field: 'englishName', label: '英文名', value: secondary.englishName })
  }
  if (primary.gender === 'unspecified' && secondary.gender !== 'unspecified') {
    updates.gender = secondary.gender
    fillIns.push({ field: 'gender', label: '性別', value: secondary.gender === 'male' ? '男' : '女' })
  }
  if (!primary.birthYear && secondary.birthYear) {
    updates.birthYear = secondary.birthYear
    fillIns.push({ field: 'birthYear', label: '出生年', value: String(secondary.birthYear) })
  }
  if (!primary.teacherNo && secondary.teacherNo) {
    updates.teacherNo = secondary.teacherNo
    fillIns.push({ field: 'teacherNo', label: '授課老師編號', value: secondary.teacherNo })
  }

  return { updates, fillIns }
}

export type CertificateConflict = {
  courseCatalogId: number
  courseCatalogLabel: string
  primary: { producedAt: Date | null; note: string | null }
  secondary: { producedAt: Date | null; note: string | null }
}

async function findCertificateConflicts(primaryId: string, secondaryId: string): Promise<CertificateConflict[]> {
  const [primaryCerts, secondaryCerts] = await Promise.all([
    prisma.certificateProduction.findMany({
      where: { userId: primaryId },
      select: { courseCatalogId: true, producedAt: true, note: true, courseCatalog: { select: { label: true } } },
    }),
    prisma.certificateProduction.findMany({
      where: { userId: secondaryId },
      select: { courseCatalogId: true, producedAt: true, note: true, courseCatalog: { select: { label: true } } },
    }),
  ])
  const secondaryByCatalog = new Map(secondaryCerts.map((c) => [c.courseCatalogId, c]))
  const conflicts: CertificateConflict[] = []
  for (const p of primaryCerts) {
    const s = secondaryByCatalog.get(p.courseCatalogId)
    if (s) {
      conflicts.push({
        courseCatalogId: p.courseCatalogId,
        courseCatalogLabel: p.courseCatalog.label,
        primary: { producedAt: p.producedAt, note: p.note },
        secondary: { producedAt: s.producedAt, note: s.note },
      })
    }
  }
  return conflicts
}

export type EnrollmentConflict = {
  inviteId: number
  inviteTitle: string
  primary: { status: string; graduatedAt: Date | null; materialChoice: string }
  secondary: { status: string; graduatedAt: Date | null; materialChoice: string }
}

async function findEnrollmentConflicts(primaryId: string, secondaryId: string): Promise<EnrollmentConflict[]> {
  const [primaryEnrollments, secondaryEnrollments] = await Promise.all([
    prisma.inviteEnrollment.findMany({
      where: { userId: primaryId },
      select: { inviteId: true, status: true, graduatedAt: true, materialChoice: true, invite: { select: { title: true } } },
    }),
    prisma.inviteEnrollment.findMany({
      where: { userId: secondaryId },
      select: { inviteId: true, status: true, graduatedAt: true, materialChoice: true, invite: { select: { title: true } } },
    }),
  ])
  const secondaryByInvite = new Map(secondaryEnrollments.map((e) => [e.inviteId, e]))
  const conflicts: EnrollmentConflict[] = []
  for (const p of primaryEnrollments) {
    const s = secondaryByInvite.get(p.inviteId)
    if (s) {
      conflicts.push({
        inviteId: p.inviteId,
        inviteTitle: p.invite.title,
        primary: { status: p.status, graduatedAt: p.graduatedAt, materialChoice: p.materialChoice },
        secondary: { status: s.status, graduatedAt: s.graduatedAt, materialChoice: s.materialChoice },
      })
    }
  }
  return conflicts
}

export type LearningIntentConflict = {
  primary: { courseCatalogIds: number[]; timePreferences: string[]; otherNote: string | null }
  secondary: { courseCatalogIds: number[]; timePreferences: string[]; otherNote: string | null }
}

async function findLearningIntentConflict(primaryId: string, secondaryId: string): Promise<LearningIntentConflict | null> {
  const [p, s] = await Promise.all([
    prisma.learningIntent.findUnique({ where: { userId: primaryId } }),
    prisma.learningIntent.findUnique({ where: { userId: secondaryId } }),
  ])
  if (!p || !s) return null
  return {
    primary: { courseCatalogIds: p.courseCatalogIds, timePreferences: p.timePreferences, otherNote: p.otherNote },
    secondary: { courseCatalogIds: s.courseCatalogIds, timePreferences: s.timePreferences, otherNote: s.otherNote },
  }
}

export type MergePreview = {
  primary: MergeAccountSummary
  secondary: MergeAccountSummary
  suggestedSecondaryId: string | null
  counts: {
    friendships: number
    conversationParticipants: number
    courseInvites: number
    enrollments: number
    certificates: number
    learningFeedbacks: number
    learningStudyEntries: number
    supportInquiries: number
    notifications: number
    pushSubscriptions: number
  }
  certificateConflicts: CertificateConflict[]
  enrollmentConflicts: EnrollmentConflict[]
  learningIntentConflict: LearningIntentConflict | null
  rolesUnion: UserRole[]
  learningLevelMax: number
  profileFillIns: ProfileFillIn[]
}

// ── 搜尋另一帳號（合併精靈的 StudentPicker 搜尋來源，不限友誼關係）──
export async function searchMembersForMerge(
  query: string,
  excludeUserIds: string[]
): Promise<ActionResponse<{ candidates: StudentPickerCandidate[] }>> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, message: '請先登入' }
  if (!canAccessAdmin(session.user.roles)) return { success: false, message: '無權限' }

  const candidates = await searchStudentCandidates(session.user.id, query, excludeUserIds)
  return { success: true, data: { candidates } }
}

// ── 主/副帳號方向建議：UI 在尚未決定方向前，用這個輕量查詢取得 isUndeliverableEmail 判斷結果 ──
export async function suggestMergeDirection(
  accountAId: string,
  accountBId: string
): Promise<ActionResponse<{ suggestedSecondaryId: string | null }>> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, message: '請先登入' }
  if (!canAccessAdmin(session.user.roles)) return { success: false, message: '無權限' }

  const [a, b] = await Promise.all([
    prisma.user.findUnique({ where: { id: accountAId }, select: { id: true, email: true } }),
    prisma.user.findUnique({ where: { id: accountBId }, select: { id: true, email: true } }),
  ])
  if (!a || !b) return { success: false, message: '找不到帳號' }

  return { success: true, data: { suggestedSecondaryId: suggestSecondary(a, b) } }
}

// ── 合併預覽：關聯筆數、unique 衝突、roles/learningLevel 建議、個人資料補空值清單 ──
export async function previewMemberMerge(
  primaryId: string,
  secondaryId: string
): Promise<ActionResponse<MergePreview>> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, message: '請先登入' }
  if (!canAccessAdmin(session.user.roles)) return { success: false, message: '無權限' }

  if (primaryId === secondaryId) return { success: false, message: '主帳號與副帳號不可相同' }

  const [primary, secondary] = await Promise.all([fetchProfile(primaryId), fetchProfile(secondaryId)])
  if (!primary) return { success: false, message: '找不到主帳號' }
  if (!secondary) return { success: false, message: '找不到副帳號' }
  if (primary.mergedIntoId) return { success: false, message: '主帳號已是另一次合併的副帳號，不支援合併鏈' }
  if (secondary.mergedIntoId) return { success: false, message: '副帳號已是另一次合併的副帳號，不支援合併鏈' }

  const [
    friendships,
    conversationParticipants,
    courseInvites,
    enrollments,
    certificates,
    learningFeedbacks,
    learningStudyEntries,
    supportInquiries,
    notifications,
    pushSubscriptions,
  ] = await Promise.all([
    prisma.friendship.count({ where: { OR: [{ ownerId: secondaryId }, { friendId: secondaryId }] } }),
    prisma.conversationParticipant.count({ where: { userId: secondaryId } }),
    prisma.courseInvite.count({ where: { createdById: secondaryId } }),
    prisma.inviteEnrollment.count({ where: { userId: secondaryId } }),
    prisma.certificateProduction.count({ where: { userId: secondaryId } }),
    prisma.learningRecordFeedback.count({ where: { userId: secondaryId } }),
    prisma.learningStudyEntry.count({ where: { userId: secondaryId } }),
    prisma.supportInquiry.count({ where: { userId: secondaryId } }),
    prisma.notification.count({ where: { userId: secondaryId } }),
    prisma.pushSubscription.count({ where: { userId: secondaryId } }),
  ])

  const [certificateConflicts, enrollmentConflicts, learningIntentConflict] = await Promise.all([
    findCertificateConflicts(primaryId, secondaryId),
    findEnrollmentConflicts(primaryId, secondaryId),
    findLearningIntentConflict(primaryId, secondaryId),
  ])

  const { fillIns } = computeProfileFillIns(primary, secondary)

  return {
    success: true,
    data: {
      primary: toSummary(primary),
      secondary: toSummary(secondary),
      suggestedSecondaryId: suggestSecondary(primary, secondary),
      counts: {
        friendships,
        conversationParticipants,
        courseInvites,
        enrollments,
        certificates,
        learningFeedbacks,
        learningStudyEntries,
        supportInquiries,
        notifications,
        pushSubscriptions,
      },
      certificateConflicts,
      enrollmentConflicts,
      learningIntentConflict,
      rolesUnion: [...new Set([...primary.roles, ...secondary.roles])],
      learningLevelMax: Math.max(primary.learningLevel, secondary.learningLevel),
      profileFillIns: fillIns,
    },
  }
}

export type MergeMembersInput = {
  primaryId: string
  secondaryId: string
  certificateResolutions: Record<number, 'primary' | 'secondary'>
  learningIntentResolution: 'primary' | 'secondary' | null
  enrollmentResolutions: Record<number, 'primary' | 'secondary'>
  roles: UserRole[]
  learningLevel: number
  notify: boolean
}

// ── 確認合併：單一交易內搬動關聯資料、標記副帳號、寫入 AdminActionLog ──
export async function mergeMembers(input: MergeMembersInput): Promise<ActionResponse> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, message: '請先登入' }
  if (!canAccessAdmin(session.user.roles)) return { success: false, message: '無權限' }

  const { primaryId, secondaryId } = input
  if (primaryId === secondaryId) return { success: false, message: '主帳號與副帳號不可相同' }

  const [primary, secondary] = await Promise.all([fetchProfile(primaryId), fetchProfile(secondaryId)])
  if (!primary) return { success: false, message: '找不到主帳號' }
  if (!secondary) return { success: false, message: '找不到副帳號' }
  if (primary.mergedIntoId) return { success: false, message: '主帳號已是另一次合併的副帳號，不支援合併鏈' }
  if (secondary.mergedIntoId) return { success: false, message: '副帳號已是另一次合併的副帳號，不支援合併鏈' }

  // 重新查詢一次所有衝突，確認跟前端送來的 resolutions 鍵集合一致（資料未在預覽後變動）
  const [certificateConflicts, enrollmentConflicts, learningIntentConflict] = await Promise.all([
    findCertificateConflicts(primaryId, secondaryId),
    findEnrollmentConflicts(primaryId, secondaryId),
    findLearningIntentConflict(primaryId, secondaryId),
  ])

  const resolvedCertCatalogIds = new Set(Object.keys(input.certificateResolutions).map(Number))
  const certCatalogIds = new Set(certificateConflicts.map((c) => c.courseCatalogId))
  const certMismatch =
    certCatalogIds.size !== resolvedCertCatalogIds.size || [...certCatalogIds].some((id) => !resolvedCertCatalogIds.has(id))

  const resolvedInviteIds = new Set(Object.keys(input.enrollmentResolutions).map(Number))
  const inviteIds = new Set(enrollmentConflicts.map((c) => c.inviteId))
  const enrollmentMismatch =
    inviteIds.size !== resolvedInviteIds.size || [...inviteIds].some((id) => !resolvedInviteIds.has(id))

  const intentMismatch = Boolean(learningIntentConflict) !== (input.learningIntentResolution !== null)

  if (certMismatch || enrollmentMismatch || intentMismatch) {
    return { success: false, message: '資料已變動，請重新預覽後再試一次' }
  }

  const actor = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { realName: true, nickname: true },
  })
  const actorName = actor?.realName || actor?.nickname || session.user.email || '管理者'
  const secondarySnapshot = `${secondary.realName || secondary.nickname || '（未填）'}（${secondary.email}）`
  const primaryLabel = `${primary.realName || primary.nickname || '（未填）'}（${primary.email}）`

  const { updates: profileUpdates } = computeProfileFillIns(primary, secondary)

  try {
    await prisma.$transaction(async (tx) => {
      // 1. Friendship：去重 + 去自我關係，再搬動
      const secondaryAsOwner = await tx.friendship.findMany({ where: { ownerId: secondaryId } })
      const primaryOwnerFriendIds = new Set(
        (await tx.friendship.findMany({ where: { ownerId: primaryId }, select: { friendId: true } })).map((f) => f.friendId)
      )
      for (const f of secondaryAsOwner) {
        if (f.friendId === primaryId || primaryOwnerFriendIds.has(f.friendId)) {
          await tx.friendship.delete({ where: { id: f.id } })
        } else {
          await tx.friendship.update({ where: { id: f.id }, data: { ownerId: primaryId } })
        }
      }

      const secondaryAsFriend = await tx.friendship.findMany({ where: { friendId: secondaryId } })
      const primaryFriendOwnerIds = new Set(
        (await tx.friendship.findMany({ where: { friendId: primaryId }, select: { ownerId: true } })).map((f) => f.ownerId)
      )
      for (const f of secondaryAsFriend) {
        if (f.ownerId === primaryId || primaryFriendOwnerIds.has(f.ownerId)) {
          await tx.friendship.delete({ where: { id: f.id } })
        } else {
          await tx.friendship.update({ where: { id: f.id }, data: { friendId: primaryId } })
        }
      }

      // 2. ConversationParticipant：去重，再搬動
      const secondaryParticipations = await tx.conversationParticipant.findMany({ where: { userId: secondaryId } })
      const primaryConversationIds = new Set(
        (await tx.conversationParticipant.findMany({ where: { userId: primaryId }, select: { conversationId: true } })).map(
          (p) => p.conversationId
        )
      )
      for (const p of secondaryParticipations) {
        if (primaryConversationIds.has(p.conversationId)) {
          await tx.conversationParticipant.delete({ where: { id: p.id } })
        } else {
          await tx.conversationParticipant.update({ where: { id: p.id }, data: { userId: primaryId } })
        }
      }

      // 3. 其餘無 unique 衝突的關聯：直接搬動
      await tx.conversationMessage.updateMany({ where: { authorId: secondaryId }, data: { authorId: primaryId } })
      await tx.conversation.updateMany({ where: { createdById: secondaryId }, data: { createdById: primaryId } })
      await tx.courseInvite.updateMany({ where: { createdById: secondaryId }, data: { createdById: primaryId } })

      // 4. InviteEnrollment：依選邊結果捨棄未選中那筆，再搬動剩餘（含 recommendDeferredById，此欄位屬 InviteEnrollment 而非 CourseInvite）
      for (const conflict of enrollmentConflicts) {
        const keep = input.enrollmentResolutions[conflict.inviteId]
        const discardUserId = keep === 'primary' ? secondaryId : primaryId
        await tx.inviteEnrollment.deleteMany({ where: { inviteId: conflict.inviteId, userId: discardUserId } })
      }
      await tx.inviteEnrollment.updateMany({ where: { userId: secondaryId }, data: { userId: primaryId } })
      await tx.inviteEnrollment.updateMany({ where: { recommendDeferredById: secondaryId }, data: { recommendDeferredById: primaryId } })

      // 5. CertificateProduction：依選邊結果捨棄未選中那筆，再搬動剩餘
      for (const conflict of certificateConflicts) {
        const keep = input.certificateResolutions[conflict.courseCatalogId]
        const discardUserId = keep === 'primary' ? secondaryId : primaryId
        await tx.certificateProduction.deleteMany({ where: { courseCatalogId: conflict.courseCatalogId, userId: discardUserId } })
      }
      await tx.certificateProduction.updateMany({ where: { userId: secondaryId }, data: { userId: primaryId } })
      await tx.certificateProduction.updateMany({ where: { producedById: secondaryId }, data: { producedById: primaryId } })

      // 6. LearningIntent：雙方都有才需選邊，捨棄未選中那筆，再搬動剩餘
      if (learningIntentConflict) {
        const keep = input.learningIntentResolution
        const discardUserId = keep === 'primary' ? secondaryId : primaryId
        await tx.learningIntent.deleteMany({ where: { userId: discardUserId } })
      }
      await tx.learningIntent.updateMany({ where: { userId: secondaryId }, data: { userId: primaryId } })

      // 7. 其餘無衝突關聯：直接搬動
      await tx.learningRecordFeedback.updateMany({ where: { userId: secondaryId }, data: { userId: primaryId } })
      await tx.learningRecordFeedback.updateMany({ where: { resolvedById: secondaryId }, data: { resolvedById: primaryId } })
      await tx.learningStudyEntry.updateMany({ where: { userId: secondaryId }, data: { userId: primaryId } })
      await tx.supportInquiry.updateMany({ where: { userId: secondaryId }, data: { userId: primaryId } })
      await tx.supportInquiry.updateMany({ where: { repliedById: secondaryId }, data: { repliedById: primaryId } })
      await tx.notification.updateMany({ where: { userId: secondaryId }, data: { userId: primaryId } })
      await tx.pushSubscription.updateMany({ where: { userId: secondaryId }, data: { userId: primaryId } })

      // 8. 主帳號：roles／learningLevel 合併結果 + 個人資料補空值
      await tx.user.update({
        where: { id: primaryId },
        data: {
          roles: input.roles,
          learningLevel: input.learningLevel,
          ...profileUpdates,
        },
      })

      // 9. 副帳號：標記已合併，不刪除
      await tx.user.update({
        where: { id: secondaryId },
        data: { mergedIntoId: primaryId, mergedAt: new Date(), mergedById: session.user.id },
      })

      // 10. 操作紀錄
      await tx.adminActionLog.create({
        data: {
          action: 'member_merge',
          actorId: session.user.id,
          actorName,
          targetUserId: secondaryId,
          targetName: secondarySnapshot,
          detail: `已併入主帳號 ${primaryLabel}`,
        },
      })
    })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      console.error('[mergeMembers] 交易內撞到 unique 衝突（防呆已排除，僅可能是併發競態）：', error)
      return { success: false, message: '資料可能已變動，請重新預覽後再試一次' }
    }
    throw error
  }

  revalidatePath(`/admin/members/${primaryId}`)
  revalidatePath(`/admin/members/${secondaryId}`)
  revalidatePath('/admin/members/duplicates')

  if (input.notify && !isUndeliverableEmail(secondary.email)) {
    const to = resolveContactEmail(secondary)
    sendAccountMergedNotification(to, primary.spiritId ?? '').catch((err) => {
      console.error('[mergeMembers] 合併通知信寄送失敗：', err)
    })
  }

  return { success: true, message: `已將副帳號併入主帳號 ${primaryLabel}` }
}
