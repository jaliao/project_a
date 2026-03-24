/*
 * ----------------------------------------------
 * 邀請連結頁面
 * 2026-03-23
 * app/invite/[token]/page.tsx
 *
 * 已登入：執行加入邏輯後 redirect /course/{inviteId}
 * 未登入：middleware 已攔截導向 /login?callbackUrl=/invite/[token]
 * 無效 token：顯示錯誤訊息
 * ----------------------------------------------
 */

import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { joinInvite } from '@/app/actions/course-invite'

interface Props {
  params: Promise<{ token: string }>
}

export default async function InvitePage({ params }: Props) {
  const { token } = await params
  const session = await auth()

  // 未登入情況由 middleware 攔截，此處不應出現
  if (!session?.user?.id) {
    redirect(`/login?callbackUrl=/invite/${token}`)
  }

  const result = await joinInvite(token)

  if (!result.success) {
    // 無效 token：顯示錯誤畫面
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center space-y-2">
          <p className="text-lg font-medium">邀請連結無效或已失效</p>
          <a href="/dashboard" className="text-sm text-muted-foreground underline">
            返回首頁
          </a>
        </div>
      </div>
    )
  }

  redirect(`/course/${result.data!.inviteId}`)
}
