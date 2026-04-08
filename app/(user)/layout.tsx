/*
 * ----------------------------------------------
 * (user) Layout - 已登入使用者共用佈局
 * 2026-03-23 (Updated: 2026-04-07)
 * app/(user)/layout.tsx
 * ----------------------------------------------
 */

import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { Topbar } from '@/components/layout/topbar'
import { getUnreadNotificationCount } from '@/lib/data/notification'

export default async function UserLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // auth() 完整版：JWT callback 讀 DB，isTempPassword / isProfileComplete 永遠是最新值
  const session = await auth()
  const userId = session?.user?.id

  if (!userId) redirect('/login')

  // 臨時密碼：強制完成 onboarding wizard
  if (session.user?.isTempPassword) redirect('/onboarding')

  // Profile 完整度：realName / phone 未填時導向個人資料頁
  const requireCompletion = process.env.REQUIRE_PROFILE_COMPLETION !== 'false'
  const spiritId = session.user?.spiritId
  if (requireCompletion && !session.user?.isProfileComplete && spiritId) {
    redirect(`/user/${spiritId.toLowerCase()}/profile?incomplete=1`)
  }

  const unreadCount = userId ? await getUnreadNotificationCount(userId) : 0

  return (
    <div className="min-h-screen flex flex-col">
      <Topbar
        unreadCount={unreadCount}
        role={session?.user?.role}
        spiritId={session?.user?.spiritId ?? undefined}
      />
      <main className="flex-1 p-6">
        {children}
      </main>
    </div>
  )
}
