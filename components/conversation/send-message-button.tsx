/*
 * ----------------------------------------------
 * SendMessageButton - 「傳訊息」共用觸發按鈕
 * 2026-08-03 (Updated: 2026-08-14)
 * components/conversation/send-message-button.tsx
 *
 * 供學員專屬頁面／後台會員詳情頁等 Server Component
 * 頁面內嵌入，點擊後導覽至訊息頁面並指定對象（cr-spec-260814-001）
 * ----------------------------------------------
 */

'use client'

import { useRouter } from 'next/navigation'
import { IconMessage } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'

type SendMessageButtonProps = {
  targetUserId: string
  label: string
  variant?: React.ComponentProps<typeof Button>['variant']
  size?: React.ComponentProps<typeof Button>['size']
}

export function SendMessageButton({ targetUserId, label, variant = 'outline', size = 'sm' }: SendMessageButtonProps) {
  const router = useRouter()

  return (
    <Button type="button" variant={variant} size={size} onClick={() => router.push(`/messages?with=${targetUserId}`)}>
      <IconMessage className="h-4 w-4" />
      {label}
    </Button>
  )
}
