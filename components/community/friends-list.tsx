/*
 * ----------------------------------------------
 * FriendsList - 社群「好友」頁籤：好友清單
 * 2026-09-01
 * components/community/friends-list.tsx
 *
 * cr-spec-260901-003：點一列＝開啟與該好友的對話（切到「訊息」頁籤，
 * 走既有 openWithUser 流程）；每列可「移除」（AlertDialog 確認）。
 * ----------------------------------------------
 */

'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { IconDotsVertical, IconTrash } from '@tabler/icons-react'
import { UserAvatar } from '@/components/shared/user-avatar'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { removeFriend } from '@/app/actions/friendship'
import type { FriendListItem } from '@/lib/data/friendship'

type Props = {
  friends: FriendListItem[]
  onOpenConversation: (userId: string) => void
  onRemoved: () => void
}

export function FriendsList({ friends, onOpenConversation, onRemoved }: Props) {
  const t = useTranslations('community')
  const tc = useTranslations('common')
  const [removingId, setRemovingId] = useState<string | null>(null)

  async function handleRemove(userId: string) {
    setRemovingId(userId)
    const result = await removeFriend(userId)
    setRemovingId(null)
    if (result.success) {
      onRemoved()
    } else {
      toast.error(result.message ?? t('notFoundError'))
    }
  }

  if (friends.length === 0) {
    return (
      <div className="rounded-lg border p-10 text-center text-sm text-muted-foreground">
        {t('friendsEmpty')}
      </div>
    )
  }

  return (
    <div className="divide-y rounded-lg border">
      {friends.map((f) => (
        <div key={f.userId} className="flex items-center gap-3 px-3 py-2">
          <button
            type="button"
            onClick={() => onOpenConversation(f.userId)}
            className="flex min-w-0 flex-1 items-center gap-3 py-1 text-left"
          >
            <UserAvatar avatarUrl={f.avatarUrl} displayName={f.displayName} />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{f.displayName}</p>
              {f.spiritId && (
                <p className="truncate font-mono text-xs text-muted-foreground">{f.spiritId}</p>
              )}
            </div>
          </button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" aria-label={t('removeFriend')}>
                <IconDotsVertical className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t('removeConfirm')}</AlertDialogTitle>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{tc('cancel')}</AlertDialogCancel>
                <AlertDialogAction
                  disabled={removingId === f.userId}
                  onClick={() => handleRemove(f.userId)}
                >
                  <IconTrash className="mr-1 h-4 w-4" />
                  {t('removeFriend')}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      ))}
    </div>
  )
}
