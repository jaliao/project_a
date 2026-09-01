/*
 * ----------------------------------------------
 * FriendsList - 社群「好友」頁籤：好友清單
 * 2026-09-01
 * components/community/friends-list.tsx
 *
 * cr-spec-260901-003：好友清單，可「傳訊息」（切到「訊息」頁籤走既有
 * openWithUser 流程）與「移除」（AlertDialog 確認）。
 * cr-spec-260901-005：清單列 → 響應式卡片格狀（手機 1 欄／sm 2 欄／
 * lg 3 欄）；每張卡顯示 顯示名稱（性別）／單位／身分別（比照後台會員
 * 管理，roles 逐一標籤），卡面兩顆按鈕「傳訊息」「刪除」。
 * ----------------------------------------------
 */

'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { IconMessage, IconTrash } from '@tabler/icons-react'
import { UserAvatar } from '@/components/shared/user-avatar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
  const tRole = useTranslations('role')
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
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {friends.map((f) => {
        const nameWithGender =
          f.gender === 'male'
            ? `${f.displayName}（${t('genderMale')}）`
            : f.gender === 'female'
              ? `${f.displayName}（${t('genderFemale')}）`
              : f.displayName

        return (
          <div key={f.userId} className="flex flex-col gap-3 rounded-lg border p-4">
            <div className="flex items-start gap-3">
              <UserAvatar avatarUrl={f.avatarUrl} displayName={f.displayName} />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{nameWithGender}</p>
                {f.spiritId && (
                  <p className="truncate font-mono text-xs text-muted-foreground">{f.spiritId}</p>
                )}
              </div>
            </div>

            <p className="text-sm text-muted-foreground">{f.unitLabel ?? '—'}</p>

            <div className="flex flex-wrap gap-1">
              {f.roles.map((r) => (
                <Badge key={r} variant="secondary" className="text-xs">
                  {tRole(r)}
                </Badge>
              ))}
            </div>

            <div className="mt-auto flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => onOpenConversation(f.userId)}
              >
                <IconMessage className="mr-1 h-4 w-4" />
                {t('cardMessage')}
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    aria-label={tc('delete')}
                  >
                    <IconTrash className="mr-1 h-4 w-4" />
                    {tc('delete')}
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
          </div>
        )
      })}
    </div>
  )
}
