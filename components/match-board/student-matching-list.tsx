/*
 * ----------------------------------------------
 * StudentMatchingList - 媒合布告欄「找學員」頁籤列表
 * 2026-09-14
 * components/match-board/student-matching-list.tsx
 *
 * cr-spec-260914-001：以共用 StudentCard 呈現刊登中上課意願的學員，
 * 卡片依好友狀態顯示「加好友」或「傳訊息」；加好友成功後該卡即時切換。
 * ----------------------------------------------
 */

'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { IconUserPlus } from '@tabler/icons-react'
import { StudentCard } from '@/components/community/student-card'
import { SendMessageButton } from '@/components/conversation/send-message-button'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { addFriendByUserId } from '@/app/actions/friendship'
import type { MatchableStudent } from '@/lib/data/learning-intent'

type Props = {
  students: MatchableStudent[]
}

export function StudentMatchingList({ students }: Props) {
  const t = useTranslations('matchBoard')
  const tTime = useTranslations('learningIntent')
  const [friendIds, setFriendIds] = useState<Set<string>>(
    () => new Set(students.filter((s) => s.isFriend).map((s) => s.userId))
  )
  const [addingId, setAddingId] = useState<string | null>(null)

  async function handleAddFriend(userId: string) {
    setAddingId(userId)
    const result = await addFriendByUserId(userId)
    setAddingId(null)
    if (result.success) {
      toast.success(result.message ?? t('addFriendSuccess'))
      setFriendIds((prev) => new Set(prev).add(userId))
    } else {
      toast.error(result.message ?? t('addFriendFailed'))
    }
  }

  if (students.length === 0) {
    return (
      <p className="rounded-lg border bg-card px-4 py-8 text-center text-sm text-muted-foreground">
        {t('emptyStudents')}
      </p>
    )
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {students.map((s) => (
        <StudentCard
          key={s.userId}
          avatarUrl={s.avatarUrl}
          displayName={s.displayName}
          gender={s.gender}
          spiritId={s.spiritId}
          unitLabel={s.unitLabel}
          roles={s.roles}
          extra={
            <div className="space-y-1.5 text-sm">
              {s.courseLabels.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {s.courseLabels.map((label) => (
                    <Badge key={label} variant="outline" className="text-xs">
                      {label}
                    </Badge>
                  ))}
                </div>
              )}
              <div className="flex flex-wrap gap-1">
                {s.timePreferences.map((value) => (
                  <Badge key={value} variant="secondary" className="text-xs">
                    {tTime(`timePreference.${value}`)}
                  </Badge>
                ))}
              </div>
              {s.otherNote && <p className="text-xs text-muted-foreground">{s.otherNote}</p>}
            </div>
          }
          actions={
            friendIds.has(s.userId) ? (
              <SendMessageButton targetUserId={s.userId} label={t('sendMessage')} />
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                disabled={addingId === s.userId}
                onClick={() => handleAddFriend(s.userId)}
              >
                <IconUserPlus className="mr-1 h-4 w-4" />
                {t('addFriend')}
              </Button>
            )
          }
        />
      ))}
    </div>
  )
}
