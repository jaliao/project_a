/*
 * ----------------------------------------------
 * Dashboard 路由（已搬移至 /admin 與 /user/[id]）
 * 2026-03-24
 * app/(user)/dashboard/page.tsx
 * ----------------------------------------------
 */

import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'

export default async function DashboardPage() {
  const session = await auth()
  if (session?.user) {
    redirect(session.user.spiritId ? `/user/${session.user.spiritId.toLowerCase()}` : '/profile')
  }
  redirect('/login')
}
