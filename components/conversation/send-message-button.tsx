/*
 * ----------------------------------------------
 * SendMessageButton - 「傳訊息」共用觸發按鈕
 * 2026-08-03
 * components/conversation/send-message-button.tsx
 *
 * 供學員專屬頁面／後台會員詳情頁等 Server Component
 * 頁面內嵌入，點擊後開啟訊息 Drawer 並指定對象
 * ----------------------------------------------
 */

'use client'

import { IconMessage } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { useMessageDrawer } from '@/components/conversation/message-drawer-provider'

type SendMessageButtonProps = {
  targetUserId: string
  label: string
  variant?: React.ComponentProps<typeof Button>['variant']
  size?: React.ComponentProps<typeof Button>['size']
}

export function SendMessageButton({ targetUserId, label, variant = 'outline', size = 'sm' }: SendMessageButtonProps) {
  const { openMessageDrawer } = useMessageDrawer()

  return (
    <Button type="button" variant={variant} size={size} onClick={() => openMessageDrawer(targetUserId)}>
      <IconMessage className="h-4 w-4" />
      {label}
    </Button>
  )
}
