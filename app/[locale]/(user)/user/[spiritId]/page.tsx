/*
 * ----------------------------------------------
 * 學員專屬頁面
 * 2026-03-24 (Updated: 2026-07-03)
 * app/(user)/user/[spiritId]/page.tsx
 * [spiritId] 為 Spirit ID 小寫（例：pa260001）
 * ----------------------------------------------
 */

import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import {
  IconUser,
  IconBook,
  IconChalkboard,
  IconShieldCheck,
  IconMessageCircle,
  IconChevronRight,
} from '@tabler/icons-react'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import {
  canAccessAdmin,
  canTeachAny,
  CATALOG_BY_TEACHER_ROLE,
  type TeacherRole,
} from '@/lib/auth-roles'
import { getMemberDisplayName } from '@/lib/utils/member-display'
import { getIdentityTags } from '@/lib/utils/identity-tags'
import { resolveAvatarUrl } from '@/lib/utils/avatar'
import { UserAvatar } from '@/components/shared/user-avatar'
import { SendMessageButton } from '@/components/conversation/send-message-button'
import { Badge } from '@/components/ui/badge'
import { ProfileBanner } from '@/components/dashboard/profile-banner'
import { InstallBanner } from '@/components/pwa/install-banner'
import { GenderPromptDialog } from '@/components/dashboard/gender-prompt-dialog'
import { CourseSessionDialog } from '@/components/course-session/course-session-dialog'
import { TestCourseSessionButton } from '@/components/course-session/test-course-session-button'
import { CourseSessionCard } from '@/components/course-session/course-session-card'
import { CourseCardGrid } from '@/components/course-session/course-card-grid'
import { CourseProgressCards } from '@/components/learning/course-progress-cards'
import { getMyEnrollments, getMyCourseSessions, getMyCompletionCertificates } from '@/lib/data/course-sessions'
import { getActiveCourses, getAllCourses } from '@/lib/data/course-catalog'
import { getMyInquiries } from '@/lib/data/support-inquiry'
import { ContactAdminCards } from '@/components/support-inquiry/contact-admin-cards'
import { getAdminSetting, CLASS_MAX_CAPACITY_KEY, CLASS_MAX_CAPACITY_DEFAULT } from '@/lib/data/admin-settings'

export const metadata: Metadata = {
  title: '首頁 — 啟動事工',
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
      englishName: true,
      nickname: true,
      displayNameMode: true,
      name: true,
      email: true,
      commEmail: true,
      phone: true,
      spiritId: true,
      roles: true,
      gender: true,
      avatarKey: true,
      image: true,
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
  // 本人：最近提問（聯繫管理者，僅本人可見）
  const myRecentInquiries = isOwnPageEarly ? (await getMyInquiries(user.id)).slice(0, 2) : []
  // 課程目錄（基本資料區塊進度三卡固定顯示）
  const allCourses = await getAllCourses()
  // 可開設課程 id 集合：由本人持有的書籍講師身分推導（admin/superadmin 於精靈內另以 isAdmin 放行）
  const teachableCatalogIds = isOwnPageEarly
    ? (session?.user?.roles ?? [])
        .map((r) => CATALOG_BY_TEACHER_ROLE[r as TeacherRole])
        .filter((n): n is number => typeof n === 'number')
    : []
  // 查詢可開設課程（開課精靈使用）
  const activeCourses = isOwnPageEarly ? await getActiveCourses() : []
  // 班級人數上限（開課精靈顯示與驗證用）
  const classMaxCapacity = Math.min(
    99,
    Math.max(1, parseInt(await getAdminSetting(CLASS_MAX_CAPACITY_KEY, CLASS_MAX_CAPACITY_DEFAULT), 10) || 7)
  )

  const displayName = getMemberDisplayName(user)

  // 計算身分標籤（系統管理員優先，講師標籤依書籍講師身分推導）
  const identityTags = getIdentityTags(user.roles)

  // 判斷是否為本人頁面
  const isOwnPage = session?.user?.spiritId?.toLowerCase() === id

  // 本人頁面才需要的資料
  const effectiveCommEmail = user.commEmail ?? user.email
  const isProfileComplete = !!(user.realName && effectiveCommEmail && user.phone)
  const isAdmin = canAccessAdmin(session?.user?.roles)

  // 開課入口：具任一書籍講師身分（或 admin/superadmin）即顯示，與 server action 授權一致
  const canTeach = canTeachAny(session?.user?.roles)

  // 強制轉導停用時才顯示 Banner（啟用時 layout guard 已轉導，無需 Banner）
  const showProfileBanner = process.env.REQUIRE_PROFILE_COMPLETION === 'false'

  return (
    <div className="space-y-6">
      {/* PWA 安裝提醒（僅本人可見，非 standalone 啟動時顯示） */}
      {isOwnPage && <InstallBanner />}

      {/* 資料完整度提醒（僅本人可見，且強制轉導停用時才顯示） */}
      {isOwnPage && showProfileBanner && (
        <ProfileBanner isComplete={isProfileComplete} displayName={displayName} spiritId={id} />
      )}

      {/* 已完成首次填寫（realName/phone 皆有值）但性別未填時彈出補填對話框（cr-spec-260803-002） */}
      {isOwnPage && !!user.realName && !!user.phone && user.gender === 'unspecified' && (
        <GenderPromptDialog />
      )}

      <h1 className="text-2xl font-semibold">首頁</h1>

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
            <UserAvatar avatarUrl={resolveAvatarUrl(user)} displayName={displayName} size="sm" />
            <span className="text-sm font-medium">{displayName}</span>
            {!isOwnPage && <SendMessageButton targetUserId={user.id} label="傳訊息" />}
          </div>

          {/* Spirit ID */}
          {user.spiritId && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground w-20 shrink-0">啟動編號</span>
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

          {/* 學習進度三卡（公開；已結業顯示學業完成時間） */}
          <div className="pt-1">
            <span className="text-sm text-muted-foreground block mb-2">學習進度</span>
            <CourseProgressCards allCourses={allCourses} certificates={certificates} />
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
                inviteId={e.inviteId}
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

      {/* 聯繫管理者（本人可見）：最近提問卡片 + 填寫新提問 */}
      {isOwnPageEarly && (
        <div className="rounded-lg border p-5 space-y-4">
          <Link
            href={`/user/${id}/inquiries`}
            className="flex items-center gap-2 w-fit hover:opacity-70 transition-opacity"
          >
            <IconMessageCircle className="h-5 w-5 text-primary" />
            <h2 className="text-base font-semibold">聯繫管理者</h2>
            <IconChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>
          <ContactAdminCards inquiries={myRecentInquiries} />
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
                  inviteId={item.id}
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
          <div className="flex flex-wrap items-center gap-2">
            <Suspense>
              <CourseSessionDialog
                instructorName={displayName}
                activeCourses={activeCourses}
                teachableCatalogIds={teachableCatalogIds}
                isAdmin={isAdmin}
                classMaxCapacity={classMaxCapacity}
              />
            </Suspense>
            {/* 測試環境專用：一鍵建立測試授課 */}
            {process.env.NODE_ENV === 'development' && <TestCourseSessionButton />}
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
