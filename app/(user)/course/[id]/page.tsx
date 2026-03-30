/*
 * ----------------------------------------------
 * 課程詳情頁
 * 2026-03-24 (Updated: 2026-03-24)
 * app/(user)/course/[id]/page.tsx
 * ----------------------------------------------
 */

export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  IconArrowLeft,
  IconChalkboard,
  IconUsers,
  IconUserCheck,
  IconCalendar,
  IconClock,
} from '@tabler/icons-react'
import { auth } from '@/lib/auth'
import { getCourseSessionById } from '@/lib/data/course-sessions'
import { checkPrerequisites } from '@/lib/data/course-catalog'
import { CourseDetailActions } from './course-detail-actions'
import { CopyInviteLinkButton } from './copy-invite-link-button'
import { StudentApplySection } from './student-apply-section'
import { PendingEnrollmentList } from './pending-enrollment-list'

export const metadata: Metadata = {
  title: '課程詳情 — 啟動靈人系統',
}

function formatDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}/${m}/${d}`
}

const MATERIAL_LABELS: Record<string, string> = {
  none: '無須購買',
  traditional: '繁體教材',
  simplified: '簡體教材',
}

const MATERIAL_COLORS: Record<string, string> = {
  none: 'bg-gray-100 text-gray-600',
  traditional: 'bg-blue-100 text-blue-700',
  simplified: 'bg-green-100 text-green-700',
}

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const numId = parseInt(id, 10)
  if (isNaN(numId)) notFound()

  const [userSession, courseSession] = await Promise.all([
    auth(),
    getCourseSessionById(numId),
  ])

  if (!courseSession) notFound()

  const levelLabel = courseSession.courseCatalogLabel

  const teacherName =
    courseSession.createdBy.realName ??
    courseSession.createdBy.name ??
    courseSession.createdBy.email ??
    '—'

  const isInstructor = userSession?.user?.id === courseSession.createdBy.id
  const currentUserId = userSession?.user?.id

  // 當前使用者的申請記錄
  const myEnrollment = currentUserId
    ? [...courseSession.approvedEnrollments, ...courseSession.pendingEnrollments].find(
        (e) => e.user.id === currentUserId
      )
    : null

  const isCancelled = !!courseSession.cancelledAt
  const isCompleted = !!courseSession.completedAt

  // 學員先修資格檢查（講師本人、已有申請、已取消/結業時不需要）
  const missingPrerequisites =
    !isInstructor && currentUserId && !myEnrollment && !isCancelled && !isCompleted
      ? await checkPrerequisites(currentUserId, courseSession.courseCatalogId)
      : []

  return (
    <div className="space-y-6 max-w-3xl">
      {/* 返回連結 */}
      <Link
        href="/course-sessions"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <IconArrowLeft className="h-4 w-4" />
        返回開課查詢
      </Link>

      {/* 頁首：標題 + 狀態標籤 */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <IconChalkboard className="h-6 w-6 text-primary shrink-0" />
          <h1 className="text-2xl font-semibold">{courseSession.title}</h1>
          <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
            {levelLabel}
          </span>
        </div>
        <div className="flex shrink-0 gap-2">
          {isCancelled && (
            <span className="rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-700">
              已取消
            </span>
          )}
          {isCompleted && !isCancelled && (
            <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700">
              已結業
            </span>
          )}
        </div>
      </div>

      {/* 取消原因 */}
      {isCancelled && courseSession.cancelReason && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <span className="font-medium">取消原因：</span>
          {courseSession.cancelReason}
        </div>
      )}

      {/* 結業資訊區塊 */}
      {isCompleted && courseSession.completedAt && (() => {
        const NON_GRADUATE_REASON_LABELS: Record<string, string> = {
          insufficient_time: '時間不足',
          other: '其他',
        }
        const graduated = courseSession.approvedEnrollments.filter((e) => e.graduatedAt)
        const nonGraduated = courseSession.approvedEnrollments.filter((e) => !e.graduatedAt)
        return (
          <div className="rounded-lg border border-green-200 bg-green-50 p-5 space-y-4">
            <h2 className="text-sm font-medium text-green-800">結業資訊</h2>
            {/* 最後一堂課程日期 */}
            <div className="text-sm">
              <span className="text-green-700">最後一堂課程日期：</span>
              <span className="font-medium text-green-900">
                {formatDate(courseSession.completedAt)}
              </span>
            </div>
            {/* 已結業學員 */}
            <div className="space-y-1">
              <p className="text-xs font-medium text-green-700">
                已結業（{graduated.length} 人）
              </p>
              {graduated.length === 0 ? (
                <p className="text-sm text-green-600">無</p>
              ) : (
                <ul className="space-y-0.5">
                  {graduated.map((e) => (
                    <li key={e.id} className="text-sm text-green-900 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
                      {e.user.name ?? e.user.email ?? '—'}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {/* 未結業學員 */}
            {nonGraduated.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-orange-700">
                  未結業（{nonGraduated.length} 人）
                </p>
                <ul className="space-y-0.5">
                  {nonGraduated.map((e) => (
                    <li key={e.id} className="text-sm text-orange-900 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-orange-400 shrink-0" />
                      {e.user.name ?? e.user.email ?? '—'}
                      <span className="text-xs text-orange-600">
                        — {e.nonGraduateReason
                          ? (NON_GRADUATE_REASON_LABELS[e.nonGraduateReason] ?? e.nonGraduateReason)
                          : '—'}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )
      })()}

      {/* 基本資訊區塊 */}
      <div className="rounded-lg border p-5 space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">基本資訊</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          {/* 授課老師 */}
          <div className="flex items-start gap-2">
            <IconUserCheck className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">授課老師</p>
              <p className="font-medium">{teacherName}</p>
              {courseSession.createdBy.email && (
                <p className="text-xs text-muted-foreground">{courseSession.createdBy.email}</p>
              )}
            </div>
          </div>
          {/* 預計開課日期 */}
          <div className="flex items-start gap-2">
            <IconCalendar className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">預計開課日期</p>
              <p className="font-medium">{courseSession.courseDate ?? '—'}</p>
            </div>
          </div>
          {/* 報名截止日期 */}
          <div className="flex items-start gap-2">
            <IconClock className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">報名截止日期</p>
              <p className="font-medium">
                {courseSession.expiredAt ? formatDate(courseSession.expiredAt) : '—'}
              </p>
            </div>
          </div>
          {/* 人數 */}
          <div className="flex items-start gap-2">
            <IconUsers className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">報名人數</p>
              <p className="font-medium">
                {courseSession.approvedEnrollments.length} / {courseSession.maxCount} 人
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 講師：複製課程連結 */}
      {isInstructor && (
        <CopyInviteLinkButton courseId={courseSession.id} />
      )}

      {/* 講師：待審申請 */}
      {isInstructor && courseSession.pendingEnrollments.length > 0 && (
        <PendingEnrollmentList enrollments={courseSession.pendingEnrollments} />
      )}

      {/* 已核准學員名單 */}
      <div className="rounded-lg border p-5 space-y-4">
        <h2 className="text-sm font-medium text-muted-foreground">
          已核准學員（{courseSession.approvedEnrollments.length} 人）
        </h2>
        {courseSession.approvedEnrollments.length === 0 ? (
          <p className="text-sm text-muted-foreground">尚無已核准學員</p>
        ) : (
          <ul className="divide-y">
            {courseSession.approvedEnrollments.map((enrollment) => (
              <li key={enrollment.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium">
                    {enrollment.user.name ?? enrollment.user.email ?? '—'}
                  </p>
                  {enrollment.user.email && (
                    <p className="text-xs text-muted-foreground">{enrollment.user.email}</p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      MATERIAL_COLORS[enrollment.materialChoice] ?? 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {MATERIAL_LABELS[enrollment.materialChoice] ?? enrollment.materialChoice}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(enrollment.joinedAt)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* 學員：申請狀態 / 申請按鈕 */}
      {!isInstructor && (
        <StudentApplySection
          inviteId={courseSession.id}
          expiredAt={courseSession.expiredAt}
          isCancelled={isCancelled}
          isCompleted={isCompleted}
          myEnrollment={myEnrollment ?? null}
          courseTitle={courseSession.title}
          courseDate={courseSession.courseDate ?? null}
          instructorName={teacherName}
          missingPrerequisites={missingPrerequisites}
        />
      )}

      {/* 講師：操作按鈕（教材申請、結業、取消授課） */}
      {isInstructor && (
        <CourseDetailActions
          inviteId={courseSession.id}
          isCancelled={isCancelled}
          isCompleted={isCompleted}
          isStarted={!!courseSession.startedAt}
          hasApprovedStudents={courseSession.approvedEnrollments.length > 0}
          courseOrder={courseSession.courseOrder}
          courseDatePrefill={courseSession.courseDate ?? undefined}
          userPrefill={{
            buyerNameZh: courseSession.createdBy.realName ?? courseSession.createdBy.name ?? undefined,
            email: courseSession.createdBy.email ?? undefined,
          }}
        />
      )}
    </div>
  )
}
