/*
 * ----------------------------------------------
 * 後台會員詳情頁（五分頁：基本資料／學習階層／講師身分／特殊設定／會員提問）
 * 2026-04-01 (Updated: 2026-07-22)
 * app/(user)/admin/members/[id]/page.tsx
 * ----------------------------------------------
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { auth } from '@/lib/auth'
import {
  isSuperadmin,
  TEACHER_ROLE_BY_CATALOG,
  BOOK_LABEL_BY_TEACHER_ROLE,
  ROLE_LABELS,
} from '@/lib/auth-roles'
import type { UserRole } from '@prisma/client'
import { getMemberDetail, getUserDisplayById } from '@/lib/data/members'
import { getMemberDisplayName } from '@/lib/utils/member-display'
import { getAdminSetting } from '@/lib/data/admin-settings'
import { getGraduatedCatalogIds } from '@/lib/data/course-catalog'
import { getInquiryList } from '@/lib/data/support-inquiry'
import { SendMessageButton } from '@/components/conversation/send-message-button'
import { MemberResetButton } from '@/components/admin/member-reset-button'
import { MemberEmailForm } from '@/components/admin/member-email-form'
import { MemberDeleteButton } from '@/components/admin/member-delete-button'
import { MemberHierarchyTree } from '@/components/admin/member-hierarchy-tree'
import { MemberTeacherRoles } from '@/components/admin/member-teacher-roles'
import { MemberSpecialRoles } from '@/components/admin/member-special-roles'
import { MemberSuspendSection } from '@/components/admin/member-suspend-section'
import { MaskedValue } from '@/components/admin/masked-value'
import { CourseSessionCard } from '@/components/course-session/course-session-card'
import { SupportInquiryCard } from '@/components/admin/support-inquiry-card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: '會員詳情 — 啟動事工',
}

function fmtDate(d: Date): string {
  return d.toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

// 登入時間需含時分
function fmtDateTime(d: Date | null): string {
  if (!d) return '—'
  return d.toLocaleString('zh-TW', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  })
}

// 年齡：僅存出生年（西元），以「當年 − 出生年」估算；未填顯示 —
function ageLabel(birthYear: number | null): string {
  if (!birthYear) return '—'
  return `${new Date().getFullYear() - birthYear} 歲`
}

// 是否已更改臨時密碼：無密碼帳號顯示「不適用」
function tempPasswordLabel(hasPassword: boolean, isTempPassword: boolean): string {
  if (!hasPassword) return '不適用'
  return isTempPassword ? '尚未更改' : '已更改'
}

export default async function MemberDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  // 登入 + admin 守衛由 (admin)/layout.tsx 處理；此處 session 供身分權限判定
  const session = await auth()
  if (!session?.user) notFound()

  const { id } = await params
  const [member, depthStr] = await Promise.all([
    getMemberDetail(id),
    getAdminSetting('hierarchy_depth', '3'),
  ])
  if (!member) notFound()

  const displayName = getMemberDisplayName(member)
  const enableDelete = process.env.ENABLE_MEMBER_DELETE === 'true'
  const hierarchyDepth = Math.min(10, Math.max(1, parseInt(depthStr, 10) || 3))
  const actorIsSuperadmin = isSuperadmin(session.user.roles)

  // 學習階層：各課程階層的結業狀態（未結業 → 該階層顯示「還沒畢業」）
  const graduatedCatalogIds = await getGraduatedCatalogIds(member.id)
  const HIERARCHY_LEVELS = [
    { id: 1, label: '啟動靈人' },
    { id: 2, label: '啟動豐盛' },
    { id: 3, label: '啟動得勝' },
  ]

  // 會員提問（新分頁用）
  const ti = await getTranslations('supportInquiry')
  const memberInquiries = await getInquiryList({ userId: member.id, status: 'all' })

  const INQUIRY_CATEGORY_LABELS: Record<string, string> = {
    account: ti('categoryAccount'),
    course: ti('categoryCourse'),
    material: ti('categoryMaterial'),
    other: ti('categoryOther'),
  }

  // 暫停操作人顯示名稱
  const suspendedByUser = member.suspendedById
    ? await getUserDisplayById(member.suspendedById)
    : null
  const suspendedByName = suspendedByUser ? getMemberDisplayName(suspendedByUser) : null

  // 推薦歷程：他人推薦此會員成為講師（teacherRecommended = true）
  const recommendations = member.inviteEnrollments.filter((e) => e.teacherRecommended === true)

  return (
    <div className="space-y-6">
      {/* 頁首 */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/members">← 返回清單</Link>
        </Button>
        <h1 className="text-2xl font-semibold">{displayName}</h1>
        {member.suspendedAt && (
          <Badge variant="destructive" className="text-xs">已暫停</Badge>
        )}
        <SendMessageButton targetUserId={member.id} label="傳訊息" />
      </div>

      <Tabs defaultValue="info">
        <TabsList>
          <TabsTrigger value="info">基本資料</TabsTrigger>
          <TabsTrigger value="hierarchy">學習階層</TabsTrigger>
          <TabsTrigger value="teacher">講師身分</TabsTrigger>
          <TabsTrigger value="special">特殊設定</TabsTrigger>
          <TabsTrigger value="inquiries">{ti('memberInquiriesTab')}</TabsTrigger>
        </TabsList>

        {/* ── 基本資料分頁 ── */}
        <TabsContent value="info" className="space-y-6 pt-4">
          <div className="rounded-lg border p-5 space-y-3">
            <h2 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">基本資料</h2>
            <dl className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm sm:grid-cols-3">
              <div><dt className="text-muted-foreground">姓名</dt><dd className="font-medium">{member.realName || '—'}</dd></div>
              <div><dt className="text-muted-foreground">英文名稱</dt><dd>{member.englishName || '—'}</dd></div>
              <div><dt className="text-muted-foreground">暱稱</dt><dd>{member.nickname || '—'}</dd></div>
              <div><dt className="text-muted-foreground">性別</dt><dd>{member.gender === 'male' ? '男' : member.gender === 'female' ? '女' : '未設定'}</dd></div>
              <div><dt className="text-muted-foreground">年齡</dt><dd>{ageLabel(member.birthYear)}</dd></div>
              <div><dt className="text-muted-foreground">顯示名稱</dt><dd>{displayName}</dd></div>
              <div><dt className="text-muted-foreground">Email</dt><dd><MaskedValue value={member.email} label="Email" /></dd></div>
              <div><dt className="text-muted-foreground">電話</dt><dd><MaskedValue value={member.phone} label="電話" /></dd></div>
              <div><dt className="text-muted-foreground">啟動編號</dt><dd className="font-mono text-xs">{member.spiritId || '—'}</dd></div>
              <div><dt className="text-muted-foreground">授課老師編號</dt><dd className="font-mono text-xs">{member.teacherNo || '—'}</dd></div>
              <div className="col-span-2 sm:col-span-3">
                <dt className="text-muted-foreground mb-1">身分</dt>
                <dd className="flex flex-wrap gap-1.5">
                  {(member.roles as UserRole[]).map((r) => (
                    <Badge key={r} variant="secondary" className="text-xs">{ROLE_LABELS[r] ?? r}</Badge>
                  ))}
                </dd>
              </div>
              <div><dt className="text-muted-foreground">加入日期</dt><dd>{fmtDate(member.createdAt)}</dd></div>
              <div>
                <dt className="text-muted-foreground">所屬教會/單位</dt>
                <dd>
                  {member.churchType === 'church' && member.church
                    ? member.church.name
                    : member.churchType === 'other' && member.churchOther
                      ? member.churchOther
                      : '—'}
                </dd>
              </div>
            </dl>
          </div>

          {/* ── 活躍度 ── */}
          <div className="rounded-lg border p-5 space-y-3">
            <h2 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">活躍度</h2>
            <dl className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm sm:grid-cols-3">
              <div><dt className="text-muted-foreground">最後登入時間</dt><dd>{fmtDateTime(member.lastLoginAt)}</dd></div>
              <div><dt className="text-muted-foreground">上次登入時間</dt><dd>{fmtDateTime(member.previousLoginAt)}</dd></div>
              <div><dt className="text-muted-foreground">首次登入</dt><dd>{member.lastLoginAt ? '已完成' : '尚未登入'}</dd></div>
              <div><dt className="text-muted-foreground">首次補填基本資料</dt><dd>{member.realName && member.phone ? '已補填' : '尚未補填'}</dd></div>
              <div><dt className="text-muted-foreground">臨時密碼</dt><dd>{tempPasswordLabel(member.hasPassword, member.isTempPassword)}</dd></div>
            </dl>
          </div>

          {/* 學習紀錄（標準課程卡片牆） */}
          <div className="rounded-lg border">
            <div className="px-4 py-3 border-b bg-muted/40"><h2 className="font-medium text-sm">學習紀錄</h2></div>
            {member.inviteEnrollments.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2">
                {member.inviteEnrollments.map(({ invite }) => (
                  <CourseSessionCard
                    key={invite.id}
                    inviteId={invite.id}
                    title={invite.title}
                    courseCatalogId={invite.courseCatalogId}
                    courseCatalogLabel={invite.courseCatalog.label}
                    courseDate={invite.courseDate ?? invite.orders[0]?.courseDate ?? null}
                    maxCount={invite.maxCount}
                    enrolledCount={invite._count.enrollments}
                    expiredAt={invite.expiredAt}
                    startedAt={invite.startedAt}
                    cancelledAt={invite.cancelledAt}
                    completedAt={invite.completedAt}
                    variant="compact"
                    href={`/course/${invite.id}`}
                  />
                ))}
              </div>
            ) : (
              <p className="px-4 py-6 text-center text-sm text-muted-foreground">尚無學習紀錄</p>
            )}
          </div>

          {/* 授課紀錄（標準課程卡片牆） */}
          <div className="rounded-lg border">
            <div className="px-4 py-3 border-b bg-muted/40"><h2 className="font-medium text-sm">授課紀錄</h2></div>
            {member.courseInvites.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2">
                {member.courseInvites.map((invite) => (
                  <CourseSessionCard
                    key={invite.id}
                    inviteId={invite.id}
                    title={invite.title}
                    courseCatalogId={invite.courseCatalogId}
                    courseCatalogLabel={invite.courseCatalog.label}
                    courseDate={invite.courseDate ?? invite.orders[0]?.courseDate ?? null}
                    maxCount={invite.maxCount}
                    enrolledCount={invite._count.enrollments}
                    expiredAt={invite.expiredAt}
                    startedAt={invite.startedAt}
                    cancelledAt={invite.cancelledAt}
                    completedAt={invite.completedAt}
                    variant="compact"
                    href={`/course/${invite.id}`}
                  />
                ))}
              </div>
            ) : (
              <p className="px-4 py-6 text-center text-sm text-muted-foreground">尚無授課紀錄</p>
            )}
          </div>
        </TabsContent>

        {/* ── 學習階層分頁（依課程階層分子頁：啟動靈人／啟動豐盛／啟動得勝）── */}
        <TabsContent value="hierarchy" className="pt-4">
          <Tabs defaultValue="level-1">
            <TabsList>
              {HIERARCHY_LEVELS.map((lv) => (
                <TabsTrigger key={lv.id} value={`level-${lv.id}`}>
                  {lv.label}
                </TabsTrigger>
              ))}
            </TabsList>
            {HIERARCHY_LEVELS.map((lv) => (
              <TabsContent key={lv.id} value={`level-${lv.id}`} className="pt-4">
                <div className="rounded-lg border p-5">
                  <MemberHierarchyTree
                    userId={member.id}
                    depth={hierarchyDepth}
                    courseCatalogId={lv.id}
                    graduated={graduatedCatalogIds.has(lv.id)}
                  />
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </TabsContent>

        {/* ── 講師身分分頁 ── */}
        <TabsContent value="teacher" className="space-y-6 pt-4">
          {/* 推薦歷程 */}
          <div className="rounded-lg border p-5 space-y-3">
            <h2 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">推薦歷程</h2>
            {recommendations.length > 0 ? (
              <ul className="space-y-2">
                {recommendations.map((e) => {
                  const teacherRole = TEACHER_ROLE_BY_CATALOG[e.invite.courseCatalogId]
                  const bookLabel = teacherRole ? BOOK_LABEL_BY_TEACHER_ROLE[teacherRole] : e.invite.courseCatalog.label
                  return (
                    <li key={e.invite.id} className="rounded-md border bg-muted/20 px-3 py-2 text-sm space-y-0.5">
                      <span className="inline-flex rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                        推薦成為{bookLabel}講師
                      </span>
                      {e.teacherFeedbackNote && <p className="text-muted-foreground">{e.teacherFeedbackNote}</p>}
                      <p className="text-xs text-muted-foreground">
                        推薦老師：{getMemberDisplayName(e.invite.createdBy)}
                        {e.teacherFeedbackAt && `　·　${fmtDate(e.teacherFeedbackAt)}`}
                      </p>
                    </li>
                  )
                })}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">尚無推薦紀錄</p>
            )}
          </div>

          {/* 設定講師身分授權 */}
          <div className="rounded-lg border p-5 space-y-3">
            <h2 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">設定講師身分授權</h2>
            <MemberTeacherRoles userId={member.id} roles={member.roles} />
          </div>
        </TabsContent>

        {/* ── 特殊設定分頁 ── */}
        <TabsContent value="special" className="space-y-6 pt-4">
          {/* 暫停 / 恢復 */}
          <div className="rounded-lg border p-5 space-y-3">
            <h2 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">暫停會員</h2>
            <MemberSuspendSection
              userId={member.id}
              suspendedAt={member.suspendedAt}
              suspendReason={member.suspendReason}
              suspendReasonNote={member.suspendReasonNote}
              suspendedByName={suspendedByName}
            />
          </div>

          {/* 補發密碼 */}
          <div className="rounded-lg border p-5 space-y-3">
            <h2 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">補發密碼</h2>
            <MemberResetButton userId={member.id} memberName={displayName} />
          </div>

          {/* 帳號修改（變更登入 email） */}
          <div className="rounded-lg border p-5 space-y-3">
            <h2 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">帳號修改</h2>
            <MemberEmailForm userId={member.id} currentEmail={member.email} />
          </div>

          {/* 特殊身分授權 */}
          <div className="rounded-lg border p-5 space-y-3">
            <h2 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">特殊身分授權</h2>
            <MemberSpecialRoles
              userId={member.id}
              roles={member.roles}
              isSelf={session.user.id === member.id}
              actorIsSuperadmin={actorIsSuperadmin}
            />
          </div>

          {enableDelete && (
            <div className="rounded-lg border border-destructive/30 p-5 space-y-3">
              <h2 className="font-medium text-sm text-destructive uppercase tracking-wide">危險操作</h2>
              <MemberDeleteButton userId={member.id} memberName={displayName} />
            </div>
          )}
        </TabsContent>

        {/* ── 會員提問分頁 ── */}
        <TabsContent value="inquiries" className="space-y-3 pt-4">
          {memberInquiries.length === 0 ? (
            <p className="text-sm text-muted-foreground">{ti('memberInquiriesEmpty')}</p>
          ) : (
            memberInquiries.map((inq) => (
              <SupportInquiryCard
                key={inq.id}
                id={inq.id}
                userId={inq.userId}
                isSubmitterDeleted={inq.isSubmitterDeleted}
                submitterName={inq.submitterName}
                submitterSpiritId={inq.submitterSpiritId}
                submitterRealName={inq.submitterRealName}
                submitterGenderLabel={inq.submitterGenderLabel}
                submitterChurchLabel={inq.submitterChurchLabel}
                categoryLabel={INQUIRY_CATEGORY_LABELS[inq.category]}
                body={inq.body}
                status={inq.status}
                replyBody={inq.replyBody}
                repliedByName={inq.repliedByName}
                repliedAt={inq.repliedAt}
                createdAt={inq.createdAt}
                courseInviteId={inq.courseInviteId}
                courseTitle={inq.courseTitle}
              />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
