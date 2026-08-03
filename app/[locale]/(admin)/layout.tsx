/*
 * ----------------------------------------------
 * (admin) Layout - 後台群組共用佈局與守衛
 * 2026-06-29
 * app/(admin)/layout.tsx
 *
 * 統一後台守衛：登入 → 暫停 → 臨時密碼 → profile 完整度 → admin 身分。
 * 後台各頁不再各自重複 canAccessAdmin / session 檢查。
 * ----------------------------------------------
 */

import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { canAccessAdmin } from '@/lib/auth-roles'
import { Topbar } from '@/components/layout/topbar'
import { Footer } from '@/components/layout/footer'
import { getUnreadNotificationCount } from '@/lib/data/notification'
import { getMyConversations } from '@/lib/data/conversation'
import { MessageDrawerProvider } from '@/components/conversation/message-drawer-provider'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // auth() 完整版：JWT callback 讀 DB，isTempPassword / roles 永遠是最新值
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) redirect('/login')

  const pathname = (await headers()).get('x-pathname') ?? ''

  // 被暫停會員：即時擋下
  const suspendCheck = await prisma.user.findUnique({
    where: { id: userId },
    select: { suspendedAt: true },
  })
  if (suspendCheck?.suspendedAt) redirect('/api/suspended-logout')

  // 臨時密碼：強制完成 onboarding
  if (session.user?.isTempPassword) redirect('/onboarding')

  // Profile 完整度（與 (user) 一致；後台頁非 profile 頁）
  const requireCompletion = process.env.REQUIRE_PROFILE_COMPLETION !== 'false'
  const spiritId = session.user?.spiritId
  if (requireCompletion && !session.user?.isProfileComplete && spiritId && !pathname.includes('/profile')) {
    redirect(`/user/${spiritId.toLowerCase()}/profile?incomplete=1`)
  }

  // 後台守衛：須具 admin / superadmin 身分
  if (!canAccessAdmin(session.user?.roles)) redirect('/')

  const unreadCount = await getUnreadNotificationCount(userId)
  const initialConversations = await getMyConversations(userId)

  return (
    <MessageDrawerProvider initialConversations={initialConversations} currentUserId={userId}>
      <div className="min-h-screen flex flex-col">
        <Topbar
          unreadCount={unreadCount}
          roles={session?.user?.roles}
          spiritId={session?.user?.spiritId ?? undefined}
          avatarUrl={session?.user?.avatarUrl}
        />
        <main className="flex-1 p-6">
          {children}
        </main>
        <Footer />
      </div>
    </MessageDrawerProvider>
  )
}
