/*
 * ----------------------------------------------
 * ConversationMembersDialog - 對話成員／邀請加入彈窗
 * 2026-09-01
 * components/conversation/conversation-members-dialog.tsx
 *
 * cr-spec-260901-006：對話標題列右側「成員」按鈕開啟此 Dialog（桌機/手機一致）。
 * 內含成員清單，以及「加入成員」——「從好友加入」（輸入名字即時過濾好友清單、
 * 點一位即加入）與「輸入啟動編號」兩種方式，以切換鈕互切。兩者皆走既有
 * inviteToConversation（好友加入時傳其 spiritId），伺服器端零改動。
 * ----------------------------------------------
 */

'use client'

import { useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { IconUserPlus } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { UserAvatar } from '@/components/shared/user-avatar'
import { inviteToConversation } from '@/app/actions/conversation'
import type { FriendListItem } from '@/lib/data/friendship'

type Participant = { userId: string; name: string; avatarUrl: string | null }

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  conversationId?: number
  participants: Participant[]
  friends: FriendListItem[]
  onInvited: () => void
}

export function ConversationMembersDialog({
  open,
  onOpenChange,
  conversationId,
  participants,
  friends,
  onInvited,
}: Props) {
  const t = useTranslations('conversation')
  const [mode, setMode] = useState<'friends' | 'spiritId'>('friends')
  const [q, setQ] = useState('')
  const [spiritIdInput, setSpiritIdInput] = useState('')
  const [busy, setBusy] = useState(false)

  const participantIds = useMemo(
    () => new Set(participants.map((p) => p.userId)),
    [participants]
  )
  const invitable = useMemo(
    () => friends.filter((f) => f.spiritId && !participantIds.has(f.userId)),
    [friends, participantIds]
  )
  const shown = useMemo(() => {
    const kw = q.trim().toLowerCase()
    return kw ? invitable.filter((f) => f.displayName.toLowerCase().includes(kw)) : invitable
  }, [invitable, q])

  async function handleInvite(spiritId: string) {
    if (!conversationId || !spiritId || busy) return
    setBusy(true)
    const result = await inviteToConversation(conversationId, spiritId)
    setBusy(false)
    if (result.success) {
      toast.success(t('inviteSuccess'))
      setQ('')
      setSpiritIdInput('')
      onInvited()
    } else {
      toast.error(result.message ?? t('inviteFail'))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{t('membersTitle')}</DialogTitle>
          <DialogDescription>{t('membersHint')}</DialogDescription>
        </DialogHeader>

        {/* 成員清單 */}
        <div className="max-h-48 space-y-2 overflow-y-auto">
          {participants.map((p) => (
            <div key={p.userId} className="flex items-center gap-2">
              <UserAvatar avatarUrl={p.avatarUrl} displayName={p.name} size="sm" />
              <span className="truncate text-sm">{p.name}</span>
            </div>
          ))}
        </div>

        {/* 加入成員 */}
        {conversationId != null && (
          <div className="space-y-2 border-t pt-3">
            <p className="text-sm font-medium">{t('addMember')}</p>

            <div className="flex gap-1">
              <Button
                size="sm"
                variant={mode === 'friends' ? 'default' : 'outline'}
                onClick={() => setMode('friends')}
              >
                {t('addByFriend')}
              </Button>
              <Button
                size="sm"
                variant={mode === 'spiritId' ? 'default' : 'outline'}
                onClick={() => setMode('spiritId')}
              >
                {t('addBySpiritId')}
              </Button>
            </div>

            {mode === 'friends' ? (
              <>
                <Input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder={t('friendSearchPlaceholder')}
                  className="h-8"
                />
                {invitable.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t('noFriendsToAdd')}</p>
                ) : shown.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t('noFriendMatch')}</p>
                ) : (
                  <div className="max-h-56 space-y-1 overflow-y-auto">
                    {shown.map((f) => (
                      <button
                        key={f.userId}
                        type="button"
                        disabled={busy}
                        onClick={() => handleInvite(f.spiritId!)}
                        className="flex w-full items-center gap-2 rounded-md p-2 text-left hover:bg-muted/60 disabled:opacity-50"
                      >
                        <UserAvatar avatarUrl={f.avatarUrl} displayName={f.displayName} size="sm" />
                        <span className="truncate text-sm">{f.displayName}</span>
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="flex gap-2">
                <Input
                  value={spiritIdInput}
                  onChange={(e) => setSpiritIdInput(e.target.value)}
                  placeholder={t('invitePlaceholder')}
                  className="h-8 flex-1"
                  disabled={busy}
                />
                <Button
                  size="icon"
                  variant="outline"
                  className="size-8 shrink-0"
                  onClick={() => handleInvite(spiritIdInput.trim())}
                  disabled={busy || !spiritIdInput.trim()}
                >
                  <IconUserPlus className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
