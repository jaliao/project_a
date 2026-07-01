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
  IconUsers,
  IconUserCheck,
  IconCalendar,
  IconClock,
  IconStar,
  IconStarFilled,
} from '@tabler/icons-react'
import { getTranslations } from 'next-intl/server'
import { auth } from '@/lib/auth'
import { canTeachAny, canAccessAdmin } from '@/lib/auth-roles'
import { getAdminSetting, CLASS_MAX_CAPACITY_KEY, CLASS_MAX_CAPACITY_DEFAULT } from '@/lib/data/admin-settings'
import { getCourseSessionById, getEnrollmentMaterialSummary } from '@/lib/data/course-sessions'
import { evaluateCourseStartGate } from '@/lib/utils/course-start-gate'
import { computeMaterialProgress } from '@/lib/utils/material-progress'
import { checkPrerequisites } from '@/lib/data/course-catalog'
import { getCourseMessages } from '@/lib/data/course-message'
import { CourseFaq } from '@/components/course-faq/course-faq'
import { CourseDetailActions } from './course-detail-actions'
import { MatchSettingsEditor } from './match-settings-editor'
import { EditCourseInfoDialog } from '@/components/course-session/edit-course-info-dialog'
import { CopyInviteLinkButton } from './copy-invite-link-button'
import { StudentApplySection } from './student-apply-section'
import { PendingEnrollmentList } from './pending-enrollment-list'
import { InstructorFeedbackButton } from './instructor-feedback-button'
import { getMemberDisplayName } from '@/lib/utils/member-display'
import { CourseStatusBadge } from '@/components/course-session/course-status-badge'
import { getCourseStatus } from '@/components/course-session/course-status'
import { CourseCatalogBadge } from '@/components/course-session/course-catalog-badge'
import { CourseLoginPrompt } from '@/components/course-session/course-login-prompt'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'course' })
  return { title: t('detail.metaTitle') }
}

function formatDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}/${m}/${d}`
}

const MATERIAL_COLORS: Record<string, string> = {
  none: 'bg-gray-100 text-gray-600',
  traditional: 'bg-blue-100 text-blue-700',
  simplified: 'bg-green-100 text-green-700',
}

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>
}) {
  const { id, locale } = await params
  const t = await getTranslations({ locale })
  const numId = parseInt(id, 10)
  if (isNaN(numId)) notFound()

  // 未登入訪客：顯示登入提示卡片，不查詢任何課程內容
  const userSession = await auth()
  if (!userSession?.user?.id) {
    return <CourseLoginPrompt courseId={numId} />
  }

  const courseSession = await getCourseSessionById(numId)
  if (!courseSession) notFound()

  const levelLabel = courseSession.courseCatalogLabel

  const teacherName = getMemberDisplayName(courseSession.createdBy)

  const isInstructor = userSession?.user?.id === courseSession.createdBy.id
  const currentUserId = userSession?.user?.id
  const isAdmin = canAccessAdmin(userSession?.user?.roles)
  // 編輯課程資訊：課程建立者或管理者可操作；管理者可超過人數上限
  const canEditInfo = isInstructor || isAdmin
  const classMaxCapacity = Math.min(
    99,
    Math.max(1, parseInt(await getAdminSetting(CLASS_MAX_CAPACITY_KEY, CLASS_MAX_CAPACITY_DEFAULT), 10) || 7)
  )

  // 結業資訊區塊可見性：僅管理者或講師可查閱（一般會員／學員不顯示）
  const canViewGraduation = canTeachAny(userSession?.user?.roles)

  // 課程 FAQ 留言（1 對 1 可見性：老師見全部、其他會員僅見自己的提問串）
  const faqMessages = await getCourseMessages(courseSession.id, {
    userId: currentUserId,
    isInstructor,
  })

  // 多地址寄送所需：應寄繁/簡本數（依 approved 學員 materialChoice 統計）
  const materialSummary = isInstructor
    ? await getEnrollmentMaterialSummary(courseSession.id)
    : { traditional: 0, simplified: 0 }

  // 教材申請進度（總需求／已申請／尚未申請）
  const materialProgress = computeMaterialProgress(materialSummary, courseSession.orders)

  // 開課門檻判定（≥1 已核准學員 + 尚未申請=0 + 教材全部收件）
  const startGate = evaluateCourseStartGate({
    approvedCount: courseSession.approvedEnrollments.length,
    remaining: materialProgress.remaining,
    orders: courseSession.orders,
  })

  // 當前使用者的申請記錄
  const myEnrollment = currentUserId
    ? [...courseSession.approvedEnrollments, ...courseSession.pendingEnrollments].find(
      (e) => e.user.id === currentUserId
    )
    : null

  const isCancelled = !!courseSession.cancelledAt
  const isCompleted = !!courseSession.completedAt
  const courseStatus = getCourseStatus(courseSession)

  // 學員先修資格檢查（講師本人、已有申請、已取消/結業時不需要）
  const missingPrerequisites =
    !isInstructor && currentUserId && !myEnrollment && !isCancelled && !isCompleted
      ? await checkPrerequisites(currentUserId, courseSession.courseCatalogId)
      : []

  return (
    <div className="space-y-6">
      {/* 返回連結 */}
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <IconArrowLeft className="h-4 w-4" />
        {t('common.backToHome')}
      </Link>

      {/* 頁首：標題 + 狀態標籤 + 分享按鈕 */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-2xl font-semibold">{courseSession.title}</h1>
          {/* TODO CourseCatalogBadge 和 CourseStatusBadge 大小要一樣， */}
          <CourseCatalogBadge catalogId={courseSession.courseCatalogId} label={levelLabel} size="sm" />
          {courseStatus && <CourseStatusBadge status={courseStatus} size="sm" />}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {/* 講師/管理者功能：編輯課程資訊（招生中）＋ 分享按鈕，置於右上 */}
          {canEditInfo && !courseSession.startedAt && !isCancelled && !isCompleted && (
            <EditCourseInfoDialog
              inviteId={courseSession.id}
              approvedCount={courseSession.approvedEnrollments.length}
              capacity={classMaxCapacity}
              isAdmin={isAdmin}
              initial={{
                title: courseSession.title,
                maxCount: courseSession.maxCount,
                expiredAt: courseSession.expiredAt,
                courseDate: courseSession.courseDate,
                notes: courseSession.notes,
              }}
            />
          )}
          {isInstructor && (
            <CopyInviteLinkButton courseId={courseSession.id} />
          )}
        </div>
      </div>

      {/* 取消原因 */}
      {isCancelled && courseSession.cancelReason && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <span className="font-medium">{t('course.detail.cancelReasonLabel')}</span>
          {courseSession.cancelReason}
        </div>
      )}

      {/* 結業資訊區塊（僅管理者／講師可見） */}
      {isCompleted && courseSession.completedAt && canViewGraduation && (() => {
        const nonGraduateReasonLabel = (reason: string) =>
          reason === 'insufficient_time'
            ? t('course.detail.reasonInsufficientTime')
            : reason === 'other'
              ? t('course.detail.reasonOther')
              : reason
        const graduated = courseSession.approvedEnrollments.filter((e) => e.graduatedAt)
        const nonGraduated = courseSession.approvedEnrollments.filter((e) => !e.graduatedAt)
        return (
          <div className="rounded-lg border border-green-200 bg-green-50 p-5 space-y-4">
            <h2 className="text-sm font-medium text-green-800">{t('course.detail.gradInfo')}</h2>
            {/* 最後一堂課程日期 */}
            <div className="text-sm">
              <span className="text-green-700">{t('course.detail.lastClassDate')}</span>
              <span className="font-medium text-green-900">
                {formatDate(courseSession.completedAt)}
              </span>
            </div>
            {/* 整體學習狀況（老師結業回饋，有值才顯示）*/}
            {courseSession.gradRating != null && courseSession.gradRating > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-green-700">{t('course.gradForm.ratingLabel')}：</span>
                <span className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((n) =>
                    n <= courseSession.gradRating! ? (
                      <IconStarFilled key={n} className="h-4 w-4 text-amber-500" />
                    ) : (
                      <IconStar key={n} className="h-4 w-4 text-green-300" />
                    )
                  )}
                </span>
              </div>
            )}
            {courseSession.gradTestimony && (
              <div className="text-sm">
                <span className="text-green-700">{t('course.gradForm.testimonyLabel')}：</span>
                <p className="mt-1 whitespace-pre-wrap text-green-900">{courseSession.gradTestimony}</p>
              </div>
            )}
            {/* 已結業學員 */}
            <div className="space-y-1">
              <p className="text-xs font-medium text-green-700">
                {t('course.detail.graduatedCount', { count: graduated.length })}
              </p>
              {graduated.length === 0 ? (
                <p className="text-sm text-green-600">{t('course.detail.none')}</p>
              ) : (
                <ul className="space-y-1">
                  {graduated.map((e) => (
                    <li key={e.id} className="text-sm text-green-900 flex items-center gap-1.5 flex-wrap">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
                      {getMemberDisplayName(e.user)}
                      {/* 講師資格回饋：僅課程建立者（原老師）可填寫 */}
                      {isInstructor && (
                        <InstructorFeedbackButton
                          enrollmentId={e.id}
                          studentName={getMemberDisplayName(e.user)}
                          bookLabel={courseSession.courseCatalogLabel}
                          initialRecommended={e.teacherRecommended}
                          initialNote={e.teacherFeedbackNote}
                        />
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {/* 未結業學員 */}
            {nonGraduated.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-orange-700">
                  {t('course.detail.nonGraduatedCount', { count: nonGraduated.length })}
                </p>
                <ul className="space-y-0.5">
                  {nonGraduated.map((e) => (
                    <li key={e.id} className="text-sm text-orange-900 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-orange-400 shrink-0" />
                      {getMemberDisplayName(e.user)}
                      <span className="text-xs text-orange-600">
                        — {e.nonGraduateReason ? nonGraduateReasonLabel(e.nonGraduateReason) : '—'}
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
        <h2 className="text-sm font-medium text-muted-foreground">{t('course.detail.basicInfo')}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          {/* 授課老師 */}
          <div className="flex items-start gap-2">
            <IconUserCheck className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">{t('course.detail.teacher')}</p>
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
              <p className="text-xs text-muted-foreground">{t('course.detail.expectedStartDate')}</p>
              <p className="font-medium">{courseSession.courseDate ?? '—'}</p>
            </div>
          </div>
          {/* 報名截止日期 */}
          <div className="flex items-start gap-2">
            <IconClock className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">{t('course.detail.enrollDeadline')}</p>
              <p className="font-medium">
                {courseSession.expiredAt ? formatDate(courseSession.expiredAt) : '—'}
              </p>
            </div>
          </div>
          {/* 人數 */}
          <div className="flex items-start gap-2">
            <IconUsers className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">{t('course.detail.enrollCountLabel')}</p>
              <p className="font-medium">
                {courseSession.approvedEnrollments.length} / {courseSession.maxCount} {t('course.detail.peopleSuffix')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 講師：待審申請 */}
      {isInstructor && courseSession.pendingEnrollments.length > 0 && (
        <PendingEnrollmentList enrollments={courseSession.pendingEnrollments} />
      )}

      {/* 已核准學員名單 */}
      <div className="rounded-lg border p-5 space-y-4">
        <h2 className="text-sm font-medium text-muted-foreground">
          {t('course.detail.approvedCount', { count: courseSession.approvedEnrollments.length })}
        </h2>
        {courseSession.approvedEnrollments.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('course.detail.noApproved')}</p>
        ) : (
          <ul className="divide-y">
            {courseSession.approvedEnrollments.map((enrollment) => (
              <li key={enrollment.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium">
                    {getMemberDisplayName(enrollment.user)}
                  </p>
                  {enrollment.user.email && (
                    <p className="text-xs text-muted-foreground">{enrollment.user.email}</p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${MATERIAL_COLORS[enrollment.materialChoice] ?? 'bg-gray-100 text-gray-600'
                      }`}
                  >
                    {t(`course.material.${enrollment.materialChoice}`)}
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
          orders={courseSession.orders}
          progress={materialProgress}
          canStart={startGate.canStart}
          startReasons={startGate.reasons}
          defaultRecipient={{
            name: courseSession.createdBy.realName || courseSession.createdBy.name || '',
            phone: courseSession.createdBy.phone || '',
          }}
        />
      )}

      {/* 講師：公開媒合設定（未取消／未結業時可調整） */}
      {isInstructor && !isCancelled && !isCompleted && (
        <MatchSettingsEditor
          inviteId={courseSession.id}
          isPublicMatch={courseSession.isPublicMatch}
          matchNote={courseSession.matchNote}
        />
      )}

      {/* 課程 FAQ 留言問答 */}
      <CourseFaq
        inviteId={courseSession.id}
        currentUserId={currentUserId}
        isInstructor={isInstructor}
        messages={faqMessages}
      />
    </div>
  )
}
