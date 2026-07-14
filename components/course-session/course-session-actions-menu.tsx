/*
 * ----------------------------------------------
 * CourseSessionActionsMenu - 後台開課卡片「⋯」操作選單
 * 2026-07-14
 * components/course-session/course-session-actions-menu.tsx
 *
 * 選單項：新增學員／移除學員（另開學員管理頁）、
 * 變更課程狀態（原地 dialog）、查詢 LOG（另開操作紀錄頁）
 * ----------------------------------------------
 */

'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { IconDots } from '@tabler/icons-react'
import { setCourseStatusAdmin } from '@/app/actions/course-session'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'

type CourseStatus = 'recruiting' | 'started' | 'completed' | 'cancelled'

// 可由管理者設定的目標狀態（不含已結業）
const SETTABLE_OPTIONS: { value: 'recruiting' | 'started' | 'cancelled'; label: string }[] = [
  { value: 'recruiting', label: '招生中' },
  { value: 'started', label: '進行中' },
  { value: 'cancelled', label: '已取消' },
]

interface CourseSessionActionsMenuProps {
  inviteId: number
  current: CourseStatus
}

export function CourseSessionActionsMenu({ inviteId, current }: CourseSessionActionsMenuProps) {
  const router = useRouter()
  const [statusOpen, setStatusOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const studentsHref = `/admin/course-sessions/${inviteId}/students`

  const handleStatusChange = (next: 'recruiting' | 'started' | 'cancelled') => {
    if (next === current) {
      setStatusOpen(false)
      return
    }
    startTransition(async () => {
      const res = await setCourseStatusAdmin(inviteId, next)
      if (res.success) {
        toast.success(res.message ?? '已變更狀態')
        setStatusOpen(false)
        router.refresh()
      } else {
        toast.error(res.message ?? '變更失敗')
      }
    })
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="更多操作">
            <IconDots className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <a href={`${studentsHref}?action=add`} target="_blank" rel="noopener noreferrer">
              新增學員
            </a>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <a href={studentsHref} target="_blank" rel="noopener noreferrer">
              移除學員
            </a>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setStatusOpen(true)}>變更課程狀態</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <a href={`/admin/operation-logs?inviteId=${inviteId}`} target="_blank" rel="noopener noreferrer">
              查詢 LOG
            </a>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={statusOpen} onOpenChange={setStatusOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>變更課程狀態（#{inviteId}）</DialogTitle>
            <DialogDescription>
              {current === 'completed'
                ? '已結業課程無法於後台變更狀態'
                : '可任意方向切換（含回退），不會通知講師或學員'}
            </DialogDescription>
          </DialogHeader>
          {current === 'completed' ? (
            <Button variant="outline" disabled className="w-full">
              已結業
            </Button>
          ) : (
            <div className="flex flex-col gap-2">
              {SETTABLE_OPTIONS.map((o) => (
                <Button
                  key={o.value}
                  variant={o.value === current ? 'default' : 'outline'}
                  disabled={isPending}
                  onClick={() => handleStatusChange(o.value)}
                >
                  {o.label}
                  {o.value === current && '（目前）'}
                </Button>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
