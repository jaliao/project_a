/*
 * ----------------------------------------------
 * ProfileFriendActions - 學員首頁「加好友／傳訊息」操作
 * 2026-10-23
 * components/conversation/profile-friend-actions.tsx
 *
 * 他人視角依好友狀態切換：尚非好友顯示「加好友」，加成功後即時切換
 * 為「傳訊息」，互動模式比照 student-matching-list.tsx（CR-FEAT-261023-003）
 * ----------------------------------------------
 */

'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { IconUserPlus } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { addFriendByUserId } from '@/app/actions/friendship'
import { SendMessageButton } from '@/components/conversation/send-message-button'

type Props = {
  targetUserId: string
  initialIsFriend: boolean
}

export function ProfileFriendActions({ targetUserId, initialIsFriend }: Props) {
  const t = useTranslations('studentProfile')
  const tCommunity = useTranslations('community')
  const [isFriend, setIsFriend] = useState(initialIsFriend)
  const [submitting, setSubmitting] = useState(false)

  if (isFriend) {
    return <SendMessageButton targetUserId={targetUserId} label={tCommunity('cardMessage')} />
  }

  async function handleAddFriend() {
    setSubmitting(true)
    const result = await addFriendByUserId(targetUserId)
    setSubmitting(false)
    if (result.success) {
      toast.success(result.message ?? t('addFriendSuccess'))
      setIsFriend(true)
    } else {
      toast.error(result.message ?? t('addFriendFailed'))
    }
  }

  return (
    <Button type="button" variant="outline" size="sm" disabled={submitting} onClick={handleAddFriend}>
      <IconUserPlus className="h-4 w-4" />
      {t('addFriend')}
    </Button>
  )
}
