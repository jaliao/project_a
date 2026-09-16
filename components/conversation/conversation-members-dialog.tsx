/*
 * ----------------------------------------------
 * ConversationMembersDialog - 對話成員／邀請加入彈窗
 * 2026-09-01 (Updated: 2026-09-16)
 * components/conversation/conversation-members-dialog.tsx
 *
 * cr-spec-260901-006：對話標題列右側「成員」按鈕開啟此 Dialog（桌機/手機一致）。
 * cr-spec-260914-002：成員清單下方新增「離開群組」（僅目前參與者 > 2 人時
 * 顯示），AlertDialog 確認後呼叫 leaveConversation，成功後由 onLeft 回呼
 * 通知父層關閉彈窗／取消選取該對話／重新整理頻道列表。
 * cr-spec-260916-005：「加入成員」改用通用學員選擇元件 StudentPicker（模糊
 * 搜尋或自好友清單點選），取代原本「從好友清單搜尋／輸入啟動編號」兩種
 * 切換方式；選定後直接呼叫 inviteToConversation（改吃 userId）。
 * cr-spec-260916-006：成員清單（群組對話、目前參與者 > 2 人時）除自己以外
 * 每列新增「移除」按鈕，確認後呼叫 removeConversationParticipant；對話參與
 * 者之間完全平等，任一參與者皆可移除任一其他參與者。onInvited 重新命名為
 * onMembersChanged，加入／移除成員成功後共用同一個刷新回呼。
 * ----------------------------------------------
 */

'use client'

import { useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { IconUserPlus, IconUserMinus } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import { UserAvatar } from '@/components/shared/user-avatar'
import { StudentPicker, type StudentPickerSelection } from '@/components/shared/student-picker'
import {
  inviteToConversation,
  leaveConversation,
  removeConversationParticipant,
  searchMembersForConversation,
} from '@/app/actions/conversation'
import type { FriendListItem } from '@/lib/data/friendship'

type Participant = { userId: string; name: string; avatarUrl: string | null }

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  conversationId?: number
  currentUserId: string
  participants: Participant[]
  friends: FriendListItem[]
  onMembersChanged: () => void
  onLeft: () => void
}

export function ConversationMembersDialog({
  open,
  onOpenChange,
  conversationId,
  currentUserId,
  participants,
  friends,
  onMembersChanged,
  onLeft,
}: Props) {
  const t = useTranslations('conversation')
  const [pickerOpen, setPickerOpen] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const [removeTarget, setRemoveTarget] = useState<Participant | null>(null)
  const [removing, setRemoving] = useState(false)

  const participantIds = useMemo(
    () => participants.map((p) => p.userId),
    [participants]
  )
  const isGroup = participants.length > 2

  async function handleInvite(student: StudentPickerSelection) {
    if (!conversationId) return
    const result = await inviteToConversation(conversationId, student.userId)
    if (result.success) {
      toast.success(t('inviteSuccess'))
      onMembersChanged()
    } else {
      toast.error(result.message ?? t('inviteFail'))
    }
  }

  async function handleRemove() {
    if (!conversationId || !removeTarget || removing) return
    setRemoving(true)
    const result = await removeConversationParticipant(conversationId, removeTarget.userId)
    setRemoving(false)
    setRemoveTarget(null)
    if (result.success) {
      toast.success(t('removeSuccess'))
      onMembersChanged()
    } else {
      toast.error(result.message ?? t('removeFail'))
    }
  }

  async function handleLeave() {
    if (!conversationId || leaving) return
    setLeaving(true)
    const result = await leaveConversation(conversationId)
    setLeaving(false)
    if (result.success) {
      toast.success(t('leaveSuccess'))
      onLeft()
    } else {
      toast.error(result.message ?? t('leaveFail'))
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
              <span className="truncate text-sm flex-1">{p.name}</span>
              {isGroup && p.userId !== currentUserId && (
                <button
                  type="button"
                  onClick={() => setRemoveTarget(p)}
                  className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-destructive"
                  aria-label={t('removeMember')}
                  title={t('removeMember')}
                >
                  <IconUserMinus className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* 加入成員 */}
        {conversationId != null && (
          <div className="space-y-2 border-t pt-3">
            <p className="text-sm font-medium">{t('addMember')}</p>
            <Button variant="outline" size="sm" onClick={() => setPickerOpen(true)} className="w-full gap-1.5">
              <IconUserPlus className="h-4 w-4" />
              {t('selectMember')}
            </Button>
          </div>
        )}

        {/* 離開群組：僅目前參與者超過 2 人（群組對話）時顯示 */}
        {conversationId != null && isGroup && (
          <div className="border-t pt-3">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-destructive hover:text-destructive"
                  disabled={leaving}
                >
                  {t('leaveGroup')}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t('leaveConfirm')}</AlertDialogTitle>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t('leaveConfirmNo')}</AlertDialogCancel>
                  <AlertDialogAction disabled={leaving} onClick={handleLeave}>
                    {t('leaveGroup')}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </DialogContent>

      {conversationId != null && (
        <StudentPicker
          open={pickerOpen}
          onOpenChange={setPickerOpen}
          friends={friends}
          excludeUserIds={participantIds}
          onSearch={(query) => searchMembersForConversation(conversationId, query)}
          onSelect={handleInvite}
        />
      )}

      <AlertDialog open={removeTarget != null} onOpenChange={(next) => !next && setRemoveTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('removeConfirm', { name: removeTarget?.name ?? '' })}</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removing}>{t('removeConfirmNo')}</AlertDialogCancel>
            <AlertDialogAction disabled={removing} onClick={handleRemove}>
              {t('removeMember')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  )
}
