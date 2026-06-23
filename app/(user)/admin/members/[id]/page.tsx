/*
 * ----------------------------------------------
 * 後台會員詳情頁（四分頁：基本資料／學習階層／講師身分／特殊設定）
 * 2026-04-01 (Updated: 2026-06-22)
 * app/(user)/admin/members/[id]/page.tsx
 * ----------------------------------------------
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { auth } from '@/lib/auth'
import {
  canAccessAdmin,
  isSuperadmin,
  TEACHER_ROLE_BY_CATALOG,
  BOOK_LABEL_BY_TEACHER_ROLE,
  ROLE_LABELS,
} from '@/lib/auth-roles'
import type { UserRole } from '@prisma/client'
import { getMemberDetail, getUserDisplayById } from '@/lib/data/members'
import { getMemberDisplayName } from '@/lib/utils/member-display'
import { getAdminSetting } from '@/lib/data/admin-settings'
import { MemberResetButton } from '@/components/admin/member-reset-button'
import { MemberDeleteButton } from '@/components/admin/member-delete-button'
import { MemberHierarchyTree } from '@/components/admin/member-hierarchy-tree'
import { MemberTeacherRoles } from '@/components/admin/member-teacher-roles'
import { MemberSpecialRoles } from '@/components/admin/member-special-roles'
import { MemberSuspendSection } from '@/components/admin/member-suspend-section'
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
  const session = await auth()
  if (!session?.user) redirect('/login')
  if (!canAccessAdmin(session.user.roles)) redirect('/')

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
      </div>

      <Tabs defaultValue="info">
        <TabsList>
          <TabsTrigger value="info">基本資料</TabsTrigger>
          <TabsTrigger value="hierarchy">學習階層</TabsTrigger>
          <TabsTrigger value="teacher">講師身分</TabsTrigger>
          <TabsTrigger value="special">特殊設定</TabsTrigger>
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
              <div><dt className="text-muted-foreground">顯示名稱</dt><dd>{displayName}</dd></div>
              <div><dt className="text-muted-foreground">Email</dt><dd>{member.email}</dd></div>
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

          {/* 學習紀錄 */}
          <div className="rounded-lg border">
            <div className="px-4 py-3 border-b bg-muted/40"><h2 className="font-medium text-sm">學習紀錄</h2></div>
            {member.inviteEnrollments.length > 0 ? (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="px-4 py-2 text-left font-medium text-muted-foreground">課程名稱</th>
                    <th className="px-4 py-2 text-left font-medium text-muted-foreground">課程目錄</th>
                    <th className="px-4 py-2 text-left font-medium text-muted-foreground">開始授課日期</th>
                  </tr>
                </thead>
                <tbody>
                  {member.inviteEnrollments.map((enrollment, i) => (
                    <tr key={enrollment.invite.id} className={i < member.inviteEnrollments.length - 1 ? 'border-b' : ''}>
                      <td className="px-4 py-2">{enrollment.invite.title}</td>
                      <td className="px-4 py-2 text-muted-foreground">{enrollment.invite.courseCatalog.label}</td>
                      <td className="px-4 py-2 text-muted-foreground">{enrollment.invite.startedAt ? fmtDate(enrollment.invite.startedAt) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="px-4 py-6 text-center text-sm text-muted-foreground">尚無學習紀錄</p>
            )}
          </div>

          {/* 授課紀錄 */}
          <div className="rounded-lg border">
            <div className="px-4 py-3 border-b bg-muted/40"><h2 className="font-medium text-sm">授課紀錄</h2></div>
            {member.courseInvites.length > 0 ? (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="px-4 py-2 text-left font-medium text-muted-foreground">課程名稱</th>
                    <th className="px-4 py-2 text-left font-medium text-muted-foreground">課程目錄</th>
                    <th className="px-4 py-2 text-left font-medium text-muted-foreground">開始授課日期</th>
                  </tr>
                </thead>
                <tbody>
                  {member.courseInvites.map((invite, i) => (
                    <tr key={invite.id} className={i < member.courseInvites.length - 1 ? 'border-b' : ''}>
                      <td className="px-4 py-2">{invite.title}</td>
                      <td className="px-4 py-2 text-muted-foreground">{invite.courseCatalog.label}</td>
                      <td className="px-4 py-2 text-muted-foreground">{invite.startedAt ? fmtDate(invite.startedAt) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="px-4 py-6 text-center text-sm text-muted-foreground">尚無授課紀錄</p>
            )}
          </div>
        </TabsContent>

        {/* ── 學習階層分頁 ── */}
        <TabsContent value="hierarchy" className="pt-4">
          <div className="rounded-lg border p-5">
            <MemberHierarchyTree userId={member.id} depth={hierarchyDepth} />
          </div>
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
      </Tabs>
    </div>
  )
}
