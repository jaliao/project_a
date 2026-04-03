/*
 * ----------------------------------------------
 * ProfileBanner - 資料完整度提醒 / 歡迎訊息
 * 2026-03-23
 * components/dashboard/profile-banner.tsx
 * ----------------------------------------------
 */

import Link from 'next/link'
import { IconAlertCircle, IconSparkles } from '@tabler/icons-react'

interface ProfileBannerProps {
  isComplete: boolean
  displayName: string | null
  spiritId: string
}

export function ProfileBanner({ isComplete, displayName, spiritId }: ProfileBannerProps) {
  if (isComplete) {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-primary/5 border border-primary/20 px-4 py-3 text-sm text-primary">
        <IconSparkles className="h-4 w-4 shrink-0" />
        <span>
          歡迎回來，<strong>{displayName ?? '會員'}</strong>！
        </span>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between gap-4 rounded-lg bg-orange-50 border border-orange-200 px-4 py-3 text-sm text-orange-800">
      <div className="flex items-center gap-2">
        <IconAlertCircle className="h-4 w-4 shrink-0" />
        <span>請完善您的個人資料（姓名、通訊 Email、手機號碼），以便接收重要通知。</span>
      </div>
      <Link
        href={`/user/${spiritId}/profile`}
        className="shrink-0 rounded-md bg-orange-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-orange-700 transition-colors"
      >
        前往填寫
      </Link>
    </div>
  )
}
