/*
 * ----------------------------------------------
 * 學員專屬頁面
 * 2026-03-24
 * app/(user)/user/[spiritId]/page.tsx
 * [spiritId] 為 Spirit ID 小寫（例：pa260001）
 * ----------------------------------------------
 */

import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { IconUser, IconBook, IconChalkboard, IconShieldCheck } from '@tabler/icons-react'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { Badge } from '@/components/ui/badge'
import { ProfileBanner } from '@/components/dashboard/profile-banner'
import { CourseSessionDialog } from '@/components/course-session/course-session-dialog'
import { CourseSessionCard } from '@/components/course-session/course-session-card'
import { getMyEnrollments } from '@/lib/data/course-sessions'

export const metadata: Metadata = {
  title: '學員資料 — 啟動靈人系統',
}

// learningLevel → 身分標籤
const LEARNING_LEVEL_LABEL: Record<number, string> = {
  1: '啟動靈人 1 學員',
  2: '啟動靈人 2 學員',
  3: '啟動靈人 3 學員',
  4: '啟動靈人 4 學員',
}

type Props = {
  params: Promise<{ spiritId: string }>
}

export default async function UserProfilePage({ params }: Props) {
  const { spiritId: id } = await params
  const session = await auth()

  // 查詢使用者基本資料（以 spiritId 查詢，URL 為小寫，DB 存大寫）
  const user = await prisma.user.findUnique({
    where: { spiritId: id.toUpperCase() },
    select: {
      id: true,
      realName: true,
      name: true,
      email: true,
      commEmail: true,
      phone: true,
      learningLevel: true,
      spiritId: true,
    },
  })

  if (!user) notFound()

  // 查詢學員所有課程（含狀態，供三分組顯示）
  const enrollments = await getMyEnrollments(user.id)

  // 三分組（過濾掉已取消課程）
  const pendingCourses = enrollments.filter(
    (e) => e.status === 'pending' && !e.cancelledAt
  )
  const activeCourses = enrollments.filter(
    (e) => e.status === 'approved' && !e.completedAt && !e.cancelledAt
  )
  const completedCourses = enrollments.filter(
    (e) => e.status === 'approved' && !!e.completedAt
  )

  const displayName = user.realName || user.name || '（未設定姓名）'
  const levelLabel = user.learningLevel ? LEARNING_LEVEL_LABEL[user.learningLevel] : null

  // 判斷是否為本人頁面
  const isOwnPage = session?.user?.spiritId?.toLowerCase() === id

  // 本人頁面才需要的資料
  const effectiveCommEmail = user.commEmail ?? user.email
  const isProfileComplete = !!(user.realName && effectiveCommEmail && user.phone)
  const isAdmin = session?.user?.role === 'admin' || session?.user?.role === 'superadmin'

  return (
    <div className="space-y-6">
      {/* 資料完整度提醒（僅本人可見） */}
      {isOwnPage && (
        <ProfileBanner isComplete={isProfileComplete} displayName={displayName} />
      )}

      <h1 className="text-2xl font-semibold">學員資料</h1>

      {/* 基本資料單元 */}
      <div className="rounded-lg border p-5 space-y-4">
        <div className="flex items-center gap-2">
          <IconUser className="h-5 w-5 text-primary" />
          <h2 className="text-base font-semibold">基本資料</h2>
        </div>

        <div className="space-y-3">
          {/* 姓名 */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground w-20 shrink-0">姓名</span>
            <span className="text-sm font-medium">{displayName}</span>
          </div>

          {/* Spirit ID */}
          {user.spiritId && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground w-20 shrink-0">Spirit ID</span>
              <span className="text-sm font-mono">{user.spiritId}</span>
            </div>
          )}

          {/* 身分標籤 */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground w-20 shrink-0">身分標籤</span>
            {levelLabel ? (
              <Badge variant="secondary">{levelLabel}</Badge>
            ) : (
              <span className="text-sm text-muted-foreground">—</span>
            )}
          </div>
        </div>
      </div>

      {/* 課程列表 */}
      <div className="rounded-lg border p-5 space-y-6">
        <div className="flex items-center gap-2">
          <IconBook className="h-5 w-5 text-primary" />
          <h2 className="text-base font-semibold">課程</h2>
        </div>

        {/* 申請中 */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">申請中</h3>
          {pendingCourses.length === 0 ? (
            <p className="text-sm text-muted-foreground">目前沒有申請中的課程</p>
          ) : (
            <div className="space-y-2">
              {pendingCourses.map((e) => (
                <CourseSessionCard
                  key={e.enrollmentId}
                  title={e.title}
                  courseLevel={e.courseLevel}
                  courseDate={e.courseDate}
                  maxCount={e.maxCount}
                  enrolledCount={e.enrolledCount}
                  expiredAt={e.expiredAt}
                  variant="compact"
                  href={`/course/${e.inviteId}`}
                />
              ))}
            </div>
          )}
        </div>

        {/* 已開課 */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">已開課</h3>
          {activeCourses.length === 0 ? (
            <p className="text-sm text-muted-foreground">目前沒有進行中的課程</p>
          ) : (
            <div className="space-y-2">
              {activeCourses.map((e) => (
                <CourseSessionCard
                  key={e.enrollmentId}
                  title={e.title}
                  courseLevel={e.courseLevel}
                  courseDate={e.courseDate}
                  maxCount={e.maxCount}
                  enrolledCount={e.enrolledCount}
                  expiredAt={e.expiredAt}
                  variant="compact"
                  href={`/course/${e.inviteId}`}
                />
              ))}
            </div>
          )}
        </div>

        {/* 已結業 */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">已結業</h3>
          {completedCourses.length === 0 ? (
            <p className="text-sm text-muted-foreground">尚無結業課程</p>
          ) : (
            <div className="space-y-2">
              {completedCourses.map((e) => (
                <CourseSessionCard
                  key={e.enrollmentId}
                  title={e.title}
                  courseLevel={e.courseLevel}
                  courseDate={e.courseDate}
                  maxCount={e.maxCount}
                  enrolledCount={e.enrolledCount}
                  expiredAt={e.expiredAt}
                  variant="compact"
                  href={`/course/${e.inviteId}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 授課單元（僅本人可見） */}
      {isOwnPage && (
        <div className="rounded-lg border p-5 space-y-4">
          <div className="flex items-center gap-2">
            <IconChalkboard className="h-5 w-5 text-primary" />
            <h2 className="text-base font-semibold">授課</h2>
          </div>
          <div className="flex flex-col gap-2">
            <Suspense>
              <CourseSessionDialog />
            </Suspense>
            <Link
              href={`/user/${id}/courses`}
              className="inline-flex items-center justify-center gap-2 rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
            >
              我的開課
            </Link>
          </div>
        </div>
      )}

      {/* 管理者單元（本人且為 admin/superadmin 才顯示） */}
      {isOwnPage && isAdmin && (
        <div className="rounded-lg border p-5 space-y-4">
          <div className="flex items-center gap-2">
            <IconShieldCheck className="h-5 w-5 text-primary" />
            <h2 className="text-base font-semibold">管理者</h2>
          </div>
          <div className="flex flex-col gap-2">
            <Link
              href="/admin"
              className="inline-flex items-center justify-center gap-2 rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
            >
              管理後台
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
