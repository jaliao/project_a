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
 * cr-spec-260901-007：性別「（男／女）」文字 → 共用 GenderIcon 圖示；
 * 清單上方加「名稱／啟動編號」搜尋框；每頁 50 筆換頁；卡片加「釘選／
 * 取消釘選」（釘選好友排最前面，排序由資料層 orderBy 決定）。
 * ----------------------------------------------
 */

'use client'

import { useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { IconMessage, IconPin, IconPinFilled, IconTrash } from '@tabler/icons-react'
import { UserAvatar } from '@/components/shared/user-avatar'
import { GenderIcon } from '@/components/shared/gender-icon'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
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
import { removeFriend, togglePinFriend } from '@/app/actions/friendship'
import type { FriendListItem } from '@/lib/data/friendship'

const PAGE_SIZE = 50

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
  const [pinningId, setPinningId] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)

  const q = query.trim().toLowerCase()
  const filtered = useMemo(
    () => (q ? friends.filter((f) => f.searchText.includes(q)) : friends),
    [friends, q]
  )

  // 搜尋關鍵字變更 → 回第 1 頁（於 onChange 直接重設，避免 effect 內 setState）
  function handleQueryChange(next: string) {
    setQuery(next)
    setPage(1)
  }

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageClamped = Math.min(page, totalPages)
  const pageItems = filtered.slice((pageClamped - 1) * PAGE_SIZE, pageClamped * PAGE_SIZE)

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

  async function handleTogglePin(userId: string) {
    setPinningId(userId)
    const result = await togglePinFriend(userId)
    setPinningId(null)
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
    <div className="space-y-3">
      <Input
        value={query}
        onChange={(e) => handleQueryChange(e.target.value)}
        placeholder={t('searchPlaceholder')}
        className="max-w-sm"
      />

      {filtered.length === 0 ? (
        <div className="rounded-lg border p-10 text-center text-sm text-muted-foreground">
          {t('searchEmpty')}
        </div>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {pageItems.map((f) => (
              <div key={f.userId} className="flex flex-col gap-3 rounded-lg border p-4">
                <div className="flex items-start gap-3">
                  <UserAvatar avatarUrl={f.avatarUrl} displayName={f.displayName} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1">
                      <GenderIcon gender={f.gender} />
                      <p className="truncate text-sm font-medium">{f.displayName}</p>
                    </div>
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
                    variant="ghost"
                    size="sm"
                    aria-label={f.pinnedAt ? t('unpin') : t('pin')}
                    title={f.pinnedAt ? t('unpin') : t('pin')}
                    disabled={pinningId === f.userId}
                    onClick={() => handleTogglePin(f.userId)}
                  >
                    {f.pinnedAt ? (
                      <IconPinFilled className="h-4 w-4 text-primary" />
                    ) : (
                      <IconPin className="h-4 w-4" />
                    )}
                  </Button>

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
            ))}
          </div>

          {filtered.length > PAGE_SIZE && (
            <div className="flex items-center justify-center gap-3 pt-1 text-sm">
              <Button
                variant="outline"
                size="sm"
                disabled={pageClamped <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                {t('prevPage')}
              </Button>
              <span className="text-muted-foreground">
                {t('pageIndicator', { page: pageClamped, total: totalPages })}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={pageClamped >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                {t('nextPage')}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
