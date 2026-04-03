/*
 * ----------------------------------------------
 * (user) Layout - 已登入使用者共用佈局
 * 2026-03-23 (Updated: 2026-03-24)
 * app/(user)/layout.tsx
 * ----------------------------------------------
 */

import { auth } from '@/lib/auth'
import { Topbar } from '@/components/layout/topbar'
import { getUnreadNotificationCount } from '@/lib/data/notification'

export default async function UserLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  const unreadCount = session?.user?.id
    ? await getUnreadNotificationCount(session.user.id)
    : 0

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
