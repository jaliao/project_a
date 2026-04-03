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
import { IconUser, IconBook, IconChalkboard, IconShieldCheck, IconAward, IconHistory } from '@tabler/icons-react'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { Badge } from '@/components/ui/badge'
import { ProfileBanner } from '@/components/dashboard/profile-banner'
import { CourseSessionDialog } from '@/components/course-session/course-session-dialog'
import { CourseSessionCard } from '@/components/course-session/course-session-card'
import { CourseCardGrid } from '@/components/course-session/course-card-grid'
import { CompletionCertificateCard } from '@/components/course-invite/completion-certificate-card'
import { getMyEnrollments, getMyCourseSessions, getMyCompletionCertificates } from '@/lib/data/course-sessions'
import { getActiveCourses, getGraduatedCatalogIds } from '@/lib/data/course-catalog'

export const metadata: Metadata = {
  title: '學員資料 — 啟動事工',
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
      spiritId: true,
      role: true,
    },
  })

  if (!user) notFound()

  // 查詢學員所有課程（過濾已取消）
  const allEnrollments = await getMyEnrollments(user.id)
  const enrollments = allEnrollments.filter((e) => !e.cancelledAt)

  // 判斷是否為本人頁面（提前計算，供授課查詢使用）
  const isOwnPageEarly = session?.user?.spiritId?.toLowerCase() === id
  // 查詢本人授課（最多 4 筆，用於判斷是否顯示「更多」卡片）
  const myCourseSessions = isOwnPageEarly ? await getMyCourseSessions(user.id, 4) : []
  // 查詢結業證明（所有人可見）
  const certificates = await getMyCompletionCertificates(user.id)
  // 查詢已結業課程 id 集合（用於開課資格判斷）
  const graduatedCatalogIdsSet = isOwnPageEarly
    ? await getGraduatedCatalogIds(user.id)
    : new Set<number>()
  const graduatedCatalogIds = [...graduatedCatalogIdsSet]
  // 查詢可開設課程（開課精靈使用）
  const activeCourses = isOwnPageEarly ? await getActiveCourses() : []

  const displayName = user.realName || user.name || '（未設定姓名）'

  // 計算身分標籤（角色標籤優先，講師標籤依結業紀錄升序排列）
  const identityTags: string[] = []
  if (user.role === 'admin' || user.role === 'superadmin') {
    identityTags.push('系統管理員')
  }
  for (const cert of certificates) {
    identityTags.push(`${cert.courseCatalogLabel} 講師`)
  }

  // 判斷是否為本人頁面
  const isOwnPage = session?.user?.spiritId?.toLowerCase() === id

  // 本人頁面才需要的資料
  const effectiveCommEmail = user.commEmail ?? user.email
  const isProfileComplete = !!(user.realName && effectiveCommEmail && user.phone)
  const isAdmin = session?.user?.role === 'admin' || session?.user?.role === 'superadmin'

  const canTeach = isAdmin || certificates.length > 0

  return (
    <div className="space-y-6">
      {/* 資料完整度提醒（僅本人可見） */}
      {isOwnPage && (
        <ProfileBanner isComplete={isProfileComplete} displayName={displayName} spiritId={id} />
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
          <div className="flex items-start gap-3">
            <span className="text-sm text-muted-foreground w-20 shrink-0 pt-0.5">身分標籤</span>
            {identityTags.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {identityTags.map((tag) => (
                  <Badge key={tag} variant="secondary">{tag}</Badge>
                ))}
              </div>
            ) : (
              <span className="text-sm text-muted-foreground">—</span>
            )}
          </div>
        </div>
      </div>

      {/* 課程列表 */}
      <div className="rounded-lg border p-5 space-y-4">
        <div className="flex items-center gap-2">
          <IconBook className="h-5 w-5 text-primary" />
          <h2 className="text-base font-semibold">課程</h2>
        </div>

        {enrollments.length === 0 ? (
          <p className="text-sm text-muted-foreground">尚無課程紀錄</p>
        ) : (
          <CourseCardGrid>
            {enrollments.map((e) => (
              <CourseSessionCard
                key={e.enrollmentId}
                title={e.title}
                courseCatalogId={e.courseCatalogId}
                courseCatalogLabel={e.courseCatalogLabel}
                courseDate={e.courseDate}
                maxCount={e.maxCount}
                enrolledCount={e.enrolledCount}
                expiredAt={e.expiredAt}
                startedAt={e.startedAt}
                cancelledAt={e.cancelledAt}
                completedAt={e.completedAt}
                variant="compact"
                href={`/course/${e.inviteId}`}
              />
            ))}
          </CourseCardGrid>
        )}
      </div>

      {/* 結業證明區塊（有證明才顯示） */}
      {certificates.length > 0 && (
        <div className="rounded-lg border p-5 space-y-4">
          <div className="flex items-center gap-2">
            <IconAward className="h-5 w-5 text-amber-500" />
            <h2 className="text-base font-semibold">結業證明</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {certificates.map((cert) => (
              <CompletionCertificateCard
                key={cert.courseCatalogId}
                courseCatalogLabel={cert.courseCatalogLabel}
                title={cert.title}
                teacherName={cert.teacherName}
                graduatedAt={cert.graduatedAt}
              />
            ))}
          </div>
        </div>
      )}

      {/* 學習紀錄預覽（有結業紀錄才顯示） */}
      {certificates.length > 0 && (
        <div className="rounded-lg border p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <IconHistory className="h-5 w-5 text-primary" />
              <h2 className="text-base font-semibold">學習紀錄</h2>
            </div>
            {certificates.length > 3 && (
              <Link href="/learning" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                查看更多
              </Link>
            )}
          </div>
          <ul className="space-y-2">
            {certificates.slice(0, 3).map((cert) => (
              <li key={cert.courseCatalogId} className="flex items-center justify-between text-sm">
                <span className="font-medium">{cert.title}</span>
                <span className="text-muted-foreground text-xs">
                  {cert.graduatedAt.getFullYear()}/{String(cert.graduatedAt.getMonth() + 1).padStart(2, '0')}/{String(cert.graduatedAt.getDate()).padStart(2, '0')}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 授課單元（本人且具備講師身分才顯示） */}
      {isOwnPage && canTeach && (
        <div className="rounded-lg border p-5 space-y-4">
          <div className="flex items-center gap-2">
            <IconChalkboard className="h-5 w-5 text-primary" />
            <h2 className="text-base font-semibold">授課</h2>
          </div>

          {/* 最近授課預覽 */}
          {myCourseSessions.length === 0 ? (
            <p className="text-sm text-muted-foreground">尚無授課紀錄</p>
          ) : (
            <CourseCardGrid>
              {myCourseSessions.slice(0, 3).map((item) => (
                <CourseSessionCard
                  key={item.id}
                  title={item.title}
                  courseCatalogId={item.courseCatalogId}
                  courseCatalogLabel={item.courseCatalogLabel}
                  courseDate={item.courseDate}
                  maxCount={item.maxCount}
                  enrolledCount={item.enrolledCount}
                  expiredAt={item.expiredAt}
                  startedAt={item.startedAt}
                  cancelledAt={item.cancelledAt}
                  completedAt={item.completedAt}
                  variant="compact"
                  href={`/course/${item.id}`}
                />
              ))}
              {myCourseSessions.length > 3 && (
                <Link href={`/user/${id}/courses`} className="block">
                  <div className="rounded-lg border bg-card p-4 h-full flex items-center justify-center text-sm font-medium text-muted-foreground hover:bg-muted transition-colors cursor-pointer">
                    更多授課資訊
                  </div>
                </Link>
              )}
            </CourseCardGrid>
          )}

          {/* 操作按鈕 */}
          <Suspense>
            <CourseSessionDialog
              instructorName={displayName}
              activeCourses={activeCourses}
              graduatedCatalogIds={graduatedCatalogIds}
              isAdmin={isAdmin}
            />
          </Suspense>
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
