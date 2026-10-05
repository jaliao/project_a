/*
 * ----------------------------------------------
 * 轉移班級按鈕＋Dialog（Client Component）
 * 2026-10-05
 * components/admin/member-course-invite-transfer.tsx
 *
 * cr-feat-261005-001：會員詳情頁「授課紀錄」區塊的轉移入口。勾選班級清單
 * （預設全選）＋重用 StudentPicker 元件殼（friends 固定傳空陣列、onSearch
 * 接 searchTeachersForTransfer）選擇目標老師，確認後呼叫 transferCourseInvites。
 * ----------------------------------------------
 */

'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { StudentPicker, type StudentPickerSelection } from '@/components/shared/student-picker'
import { searchTeachersForTransfer, transferCourseInvites } from '@/app/actions/admin'

type CourseInviteItem = {
  id: number
  title: string
  courseCatalogId: number
  courseCatalogLabel: string
  enrolledCount: number
}

type Props = {
  fromUserId: string
  invites: CourseInviteItem[]
}

export function MemberCourseInviteTransfer({ fromUserId, invites }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<number>>(() => new Set(invites.map((i) => i.id)))
  const [targetTeacher, setTargetTeacher] = useState<StudentPickerSelection | null>(null)
  const [isPending, startTransition] = useTransition()

  function resetState() {
    setSelectedIds(new Set(invites.map((i) => i.id)))
    setTargetTeacher(null)
  }

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (!next) resetState()
  }

  function toggleInvite(id: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function handleSearch(query: string) {
    const catalogIds = [
      ...new Set(invites.filter((i) => selectedIds.has(i.id)).map((i) => i.courseCatalogId)),
    ]
    const res = await searchTeachersForTransfer(catalogIds, query, [fromUserId])
    return {
      success: res.success,
      message: res.message,
      data: res.data
        ? { candidates: res.data.candidates.map((c) => ({ ...c, isFriend: false })) }
        : undefined,
    }
  }

  function handleConfirm() {
    if (!targetTeacher || selectedIds.size === 0) return
    startTransition(async () => {
      const result = await transferCourseInvites(fromUserId, targetTeacher.userId, [...selectedIds])
      if (result.success) {
        toast.success(result.message ?? '轉移成功')
        handleOpenChange(false)
        router.refresh()
      } else {
        toast.error(result.message ?? '轉移失敗，請稍後再試')
      }
    })
  }

  if (invites.length === 0) return null

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        轉移班級
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>轉移班級</DialogTitle>
            <DialogDescription>
              選擇要轉移的班級與目標老師，確認後這些班級的建立者將改為目標老師。
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-72 space-y-2 overflow-y-auto">
            {invites.map((invite) => (
              <label
                key={invite.id}
                className="flex items-center gap-2 rounded-md border p-2 text-sm"
              >
                <Checkbox
                  checked={selectedIds.has(invite.id)}
                  onCheckedChange={() => toggleInvite(invite.id)}
                />
                <span className="flex-1 truncate">{invite.title}</span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {invite.courseCatalogLabel}・{invite.enrolledCount} 人已報名
                </span>
              </label>
            ))}
          </div>

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">目標老師</p>
            {targetTeacher ? (
              <div className="flex items-center justify-between rounded-md border p-2 text-sm">
                <span>{targetTeacher.displayName}</span>
                <Button variant="ghost" size="sm" onClick={() => setPickerOpen(true)}>
                  重選
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPickerOpen(true)}
                disabled={selectedIds.size === 0}
              >
                選擇目標老師
              </Button>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => handleOpenChange(false)}>
              取消
            </Button>
            <Button onClick={handleConfirm} disabled={isPending || selectedIds.size === 0 || !targetTeacher}>
              {isPending ? '處理中…' : '確認轉移'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <StudentPicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        friends={[]}
        onSearch={handleSearch}
        excludeUserIds={[fromUserId]}
        onSelect={(s) => setTargetTeacher(s)}
        title="選擇目標老師"
        description="輸入啟動編號、姓名、暱稱或 Email 搜尋具備對應講師身分的老師"
      />
    </>
  )
}
