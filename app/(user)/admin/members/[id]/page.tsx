/*
 * ----------------------------------------------
 * 後台會員詳情頁
 * 2026-04-01 (Updated: 2026-04-02)
 * app/(user)/admin/members/[id]/page.tsx
 * ----------------------------------------------
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { auth } from '@/lib/auth'
import { getMemberDetail } from '@/lib/data/members'
import { getMemberDisplayName } from '@/lib/utils/member-display'
import { getAdminSetting } from '@/lib/data/admin-settings'
import { MemberResetButton } from '@/components/admin/member-reset-button'
import { MemberDeleteButton } from '@/components/admin/member-delete-button'
import { MemberHierarchyTree } from '@/components/admin/member-hierarchy-tree'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: '會員詳情 — 啟動事工',
}

const ROLE_LABELS: Record<string, string> = {
  user: '一般會員',
  admin: '管理員',
  superadmin: '超級管理員',
}

export default async function MemberDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const isAdmin =
    session.user.role === 'admin' || session.user.role === 'superadmin'
  if (!isAdmin) redirect('/')

  const { id } = await params
  const [member, depthStr] = await Promise.all([
    getMemberDetail(id),
    getAdminSetting('hierarchy_depth', '3'),
  ])
  if (!member) notFound()

  const displayName = getMemberDisplayName(member)
  const enableDelete = process.env.ENABLE_MEMBER_DELETE === 'true'
  const hierarchyDepth = Math.min(10, Math.max(1, parseInt(depthStr, 10) || 3))

  return (
    <div className="space-y-6">
      {/* 頁首 */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/members">← 返回清單</Link>
        </Button>
        <h1 className="text-2xl font-semibold">{displayName}</h1>
      </div>

      <Tabs defaultValue="info">
        <TabsList>
          <TabsTrigger value="info">基本資料</TabsTrigger>
          <TabsTrigger value="hierarchy">學習階層</TabsTrigger>
        </TabsList>

        {/* ── 基本資料分頁 ── */}
        <TabsContent value="info" className="space-y-6 pt-4">
          {/* 基本資料 */}
          <div className="rounded-lg border p-5 space-y-3">
            <h2 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">基本資料</h2>
            <dl className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-muted-foreground">姓名</dt>
                <dd className="font-medium">{member.realName || '—'}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">英文名稱</dt>
                <dd>{member.englishName || '—'}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">暱稱</dt>
                <dd>{member.nickname || '—'}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">性別</dt>
                <dd>{member.gender === 'male' ? '男' : member.gender === 'female' ? '女' : '未設定'}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">顯示名稱</dt>
                <dd>{displayName}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Email</dt>
                <dd>{member.email}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">靈人編號</dt>
                <dd className="font-mono text-xs">{member.spiritId || '—'}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">角色</dt>
                <dd>{ROLE_LABELS[member.role] ?? member.role}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">加入日期</dt>
                <dd>
                  {member.createdAt.toLocaleDateString('zh-TW', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                  })}
                </dd>
              </div>
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

          {/* 操作按鈕 */}
          <div className="flex items-center gap-3">
            <MemberResetButton userId={member.id} memberName={displayName} />
            {enableDelete && (
              <MemberDeleteButton userId={member.id} memberName={displayName} />
            )}
          </div>

          {/* 學習紀錄 */}
          <div className="rounded-lg border">
            <div className="px-4 py-3 border-b bg-muted/40">
              <h2 className="font-medium text-sm">學習紀錄</h2>
            </div>
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
                    <tr
                      key={enrollment.invite.id}
                      className={i < member.inviteEnrollments.length - 1 ? 'border-b' : ''}
                    >
                      <td className="px-4 py-2">{enrollment.invite.title}</td>
                      <td className="px-4 py-2 text-muted-foreground">
                        {enrollment.invite.courseCatalog.label}
                      </td>
                      <td className="px-4 py-2 text-muted-foreground">
                        {enrollment.invite.startedAt
                          ? enrollment.invite.startedAt.toLocaleDateString('zh-TW', {
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit',
                            })
                          : '—'}
                      </td>
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
            <div className="px-4 py-3 border-b bg-muted/40">
              <h2 className="font-medium text-sm">授課紀錄</h2>
            </div>
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
                    <tr
                      key={invite.id}
                      className={i < member.courseInvites.length - 1 ? 'border-b' : ''}
                    >
                      <td className="px-4 py-2">{invite.title}</td>
                      <td className="px-4 py-2 text-muted-foreground">
                        {invite.courseCatalog.label}
                      </td>
                      <td className="px-4 py-2 text-muted-foreground">
                        {invite.startedAt
                          ? invite.startedAt.toLocaleDateString('zh-TW', {
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit',
                            })
                          : '—'}
                      </td>
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
      </Tabs>
    </div>
  )
}
