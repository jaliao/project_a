/*
 * ----------------------------------------------
 * 個人資料頁面（redirect）
 * 2026-04-02
 * app/(user)/profile/page.tsx
 *
 * 路由已遷移至 /user/[spiritId]/profile
 * 此頁保留以相容舊書籤
 * ----------------------------------------------
 */

import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function ProfileRedirectPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const spiritId = session.user.spiritId
  if (spiritId) {
    redirect(`/user/${spiritId.toLowerCase()}/profile`)
  }

  redirect('/profile')
}
