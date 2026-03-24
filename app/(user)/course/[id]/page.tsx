/*
 * ----------------------------------------------
 * 課程詳情頁
 * 2026-03-24
 * app/(user)/course/[id]/page.tsx
 * ----------------------------------------------
 */

export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { IconArrowLeft, IconChalkboard, IconUsers, IconUserCheck } from '@tabler/icons-react'
import { getCourseSessionById } from '@/lib/data/course-sessions'
import { COURSE_CATALOG, type CourseLevel } from '@/config/course-catalog'
import { CourseDetailActions } from './course-detail-actions'

export const metadata: Metadata = {
  title: '課程詳情 — 啟動靈人系統',
}

function formatDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}/${m}/${d}`
}

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const numId = parseInt(id, 10)
  if (isNaN(numId)) notFound()

  const session = await getCourseSessionById(numId)
  if (!session) notFound()

  const catalogEntry = COURSE_CATALOG[session.courseLevel as CourseLevel]
  const levelLabel = catalogEntry?.label ?? session.courseLevel

  const teacherName =
    session.createdBy.realName ?? session.createdBy.name ?? session.createdBy.email ?? '—'

  return (
    <div className="space-y-6">
      {/* 返回連結 */}
      <Link
        href="/course-sessions"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <IconArrowLeft className="h-4 w-4" />
        返回開課查詢
      </Link>

      {/* 頁首 */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <IconChalkboard className="h-6 w-6 text-primary shrink-0" />
          <h1 className="text-2xl font-semibold">{session.title}</h1>
          <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
            {levelLabel}
          </span>
        </div>

        {/* 已取消標籤 */}
        {session.cancelledAt && (
          <span className="shrink-0 rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-700">
            已取消
          </span>
        )}
      </div>

      {/* 取消原因 */}
      {session.cancelledAt && session.cancelReason && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <span className="font-medium">取消原因：</span>
          {session.cancelReason}
        </div>
      )}

      {/* 授課老師 */}
      <div className="rounded-lg border p-5 space-y-2">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <IconUserCheck className="h-4 w-4" />
          授課老師
        </div>
        <p className="font-semibold">{teacherName}</p>
        {session.createdBy.email && (
          <p className="text-sm text-muted-foreground">{session.createdBy.email}</p>
        )}
      </div>

      {/* 學員名單 */}
      <div className="rounded-lg border p-5 space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <IconUsers className="h-4 w-4" />
          已接受學員（{session.enrollments.length} / {session.maxCount} 人）
        </div>

        {session.enrollments.length === 0 ? (
          <p className="text-sm text-muted-foreground">尚無學員加入</p>
        ) : (
          <ul className="divide-y">
            {session.enrollments.map((enrollment) => (
              <li key={enrollment.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium">
                    {enrollment.user.name ?? enrollment.user.email ?? '—'}
                  </p>
                  {enrollment.user.email && (
                    <p className="text-xs text-muted-foreground">{enrollment.user.email}</p>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  {formatDate(enrollment.joinedAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* 操作按鈕 */}
      <CourseDetailActions inviteId={session.id} isCancelled={!!session.cancelledAt} />
    </div>
  )
}
