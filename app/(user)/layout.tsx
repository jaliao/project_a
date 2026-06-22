/*
 * ----------------------------------------------
 * (user) Layout - 已登入使用者共用佈局
 * 2026-03-23 (Updated: 2026-04-07)
 * app/(user)/layout.tsx
 * ----------------------------------------------
 */

import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Topbar } from '@/components/layout/topbar'
import { getUnreadNotificationCount } from '@/lib/data/notification'
import { isGuestCoursePath } from '@/lib/utils/guest-paths'

export default async function UserLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // auth() 完整版：JWT callback 讀 DB，isTempPassword / isProfileComplete 永遠是最新值
  const session = await auth()
  const userId = session?.user?.id

  const pathname = (await headers()).get('x-pathname') ?? ''

  // 未登入訪客存取課程詳情頁：不轉導，渲染精簡版面（無 Topbar），由頁面顯示登入提示卡片
  if (!userId) {
    if (isGuestCoursePath(pathname)) {
      return (
        <div className="min-h-screen flex flex-col">
          <main className="flex-1 p-6">{children}</main>
        </div>
      )
    }
    redirect('/login')
  }

  // 被暫停會員：即時擋下（不等 token 過期）；經 route 清除 session 後導向暫停提示
  const suspendCheck = await prisma.user.findUnique({
    where: { id: userId },
    select: { suspendedAt: true },
  })
  if (suspendCheck?.suspendedAt) redirect('/api/suspended-logout')

  // 臨時密碼：強制完成 onboarding wizard
  if (session.user?.isTempPassword) redirect('/onboarding')

  // Profile 完整度：realName / phone 未填時導向個人資料頁
  // ⚠️ 排除 Profile 頁本身，避免在該頁又被導回 → 無限迴圈（profile-completion-guard spec）
  const onProfilePage = pathname.includes('/profile')
  const requireCompletion = process.env.REQUIRE_PROFILE_COMPLETION !== 'false'
  const spiritId = session.user?.spiritId
  if (requireCompletion && !session.user?.isProfileComplete && spiritId && !onProfilePage) {
    redirect(`/user/${spiritId.toLowerCase()}/profile?incomplete=1`)
  }

  const unreadCount = userId ? await getUnreadNotificationCount(userId) : 0

  return (
    <div className="min-h-screen flex flex-col">
      <Topbar
        unreadCount={unreadCount}
        roles={session?.user?.roles}
        spiritId={session?.user?.spiritId ?? undefined}
      />
      <main className="flex-1 p-6">
        {children}
      </main>
    </div>
  )
}
