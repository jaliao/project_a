/*
 * ----------------------------------------------
 * 後台班級學員管理頁
 * 2026-07-14
 * app/[locale]/(admin)/admin/course-sessions/[id]/students/page.tsx
 *
 * 頁首：班級編號＋課程名稱＋講師＋狀態；
 * 下方學員卡片清單＋新增/移除學員（?action=add 自動開新增表單）
 * ----------------------------------------------
 */

export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getInviteStudentsAdmin } from '@/lib/data/invite-students'
import { getCourseStatus } from '@/components/course-session/course-status'
import { CourseStatusBadge } from '@/components/course-session/course-status-badge'
import { AddStudentDialog, RemoveStudentButton } from '@/components/admin/invite-student-cells'
import { Badge } from '@/components/ui/badge'

export const metadata: Metadata = {
  title: '班級學員管理 — 啟動事工',
}

function fmtDate(d: Date): string {
  return new Date(d).toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

export default async function AdminInviteStudentsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ action?: string }>
}) {
  // 守衛（登入 + admin 身分）由 (admin)/layout.tsx 統一處理
  const [{ id }, sp] = await Promise.all([params, searchParams])
  const inviteId = Number(id)
  if (!Number.isInteger(inviteId) || inviteId <= 0) notFound()

  const data = await getInviteStudentsAdmin(inviteId)
  if (!data) notFound()

  const { invite, students } = data
  const status = getCourseStatus({
    startedAt: invite.startedAt,
    cancelledAt: invite.cancelledAt,
    completedAt: invite.completedAt,
  })

  return (
    <div className="space-y-6">
      {/* 頁首：班級資訊 */}
      <div className="space-y-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-sm text-muted-foreground">#{invite.id}</span>
          {status && <CourseStatusBadge status={status} size="sm" />}
        </div>
        <h1 className="text-2xl font-semibold break-words">{invite.title}</h1>
        <p className="text-sm text-muted-foreground">
          {invite.courseCatalogLabel} · 講師：{invite.instructorName}
        </p>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">學員 {students.length} 人</span>
        <AddStudentDialog
          inviteId={invite.id}
          inviteCompleted={invite.completedAt != null}
          autoOpen={sp.action === 'add'}
        />
      </div>

      {/* 學員清單 */}
      {students.length === 0 ? (
        <div className="rounded-lg border p-10 text-center text-sm text-muted-foreground">
          本班級尚無報名學員
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {students.map((s) => {
            const realNameText = [s.realName, s.englishName].filter(Boolean).join(' ')
            return (
              <div key={s.enrollmentId} className="flex flex-col gap-3 rounded-lg border p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="min-w-0 text-base font-semibold break-words">
                    {realNameText || <span className="text-destructive">未填真實姓名</span>}
                  </p>
                  {s.graduatedAt ? (
                    <Badge className="shrink-0 bg-green-100 text-green-700 hover:bg-green-100">已結業</Badge>
                  ) : s.status === 'pending' ? (
                    <Badge variant="outline" className="shrink-0 text-amber-700">待審核</Badge>
                  ) : (
                    <Badge variant="outline" className="shrink-0 text-muted-foreground">已核准</Badge>
                  )}
                </div>

                <div className="space-y-1.5 text-sm">
                  <p>
                    <span className="text-muted-foreground">啟動編號：</span>
                    {s.spiritId ? <span className="font-mono">{s.spiritId}</span> : '—'}
                  </p>
                  <p className="break-words">
                    <span className="text-muted-foreground">顯示名稱：</span>
                    {s.displayName}
                  </p>
                  <p className="break-words">
                    <span className="text-muted-foreground">Email：</span>
                    {s.email}
                  </p>
                  {s.graduatedAt && (
                    <p>
                      <span className="text-muted-foreground">結業：</span>
                      {fmtDate(s.graduatedAt)}
                    </p>
                  )}
                </div>

                <div className="mt-auto flex justify-end">
                  <RemoveStudentButton
                    enrollmentId={s.enrollmentId}
                    studentName={realNameText || s.displayName}
                    graduated={s.graduatedAt != null}
                    hasShipmentItems={s.shipmentItemCount > 0}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
