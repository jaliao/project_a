/*
 * ----------------------------------------------
 * 根路徑重定向
 * 2026-03-24
 * app/page.tsx
 * ----------------------------------------------
 */

import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'

// 根路徑：middleware 攔截未登入並導向 /login
// 已登入使用者導向個人學員頁面
export default async function RootPage() {
  const session = await auth()
  if (session?.user?.id) {
    redirect(`/user/${session.user.id}`)
  }
  redirect('/login')
}
