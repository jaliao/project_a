/*
 * ----------------------------------------------
 * 會員講師身分授權卡片（Client Component）
 * 2026-06-22
 * components/admin/member-teacher-roles.tsx
 *
 * 三本書講師身分以卡片呈現；點擊授予/移除需經確認對話框。
 * 授予成功後由 server action 寄通知信。
 * ----------------------------------------------
 */

'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { TEACHER_ROLES, BOOK_LABEL_BY_TEACHER_ROLE, type TeacherRole } from '@/lib/auth-roles'
import { grantTeacherRole, revokeTeacherRole } from '@/app/actions/admin'

export function MemberTeacherRoles({ userId, roles }: { userId: string; roles: string[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handle(role: TeacherRole, grant: boolean) {
    startTransition(async () => {
      const res = grant
        ? await grantTeacherRole(userId, role)
        : await revokeTeacherRole(userId, role)
      if (res.success) {
        toast.success(res.message ?? '已更新')
        router.refresh()
      } else {
        toast.error(res.message ?? '操作失敗，請稍後再試')
      }
    })
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {TEACHER_ROLES.map((role) => {
        const label = BOOK_LABEL_BY_TEACHER_ROLE[role]
        const granted = roles.includes(role)
        return (
          <div key={role} className="rounded-lg border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-medium">{label}講師</span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  granted ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                }`}
              >
                {granted ? '已授權' : '未授權'}
              </span>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant={granted ? 'outline' : 'default'} size="sm" disabled={isPending} className="w-full">
                  {granted ? '移除授權' : '授予授權'}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{granted ? '移除' : '授予'}「{label}講師」身分</AlertDialogTitle>
                  <AlertDialogDescription>
                    {granted
                      ? `確定移除此會員的「${label}講師」身分嗎？`
                      : `確定授予此會員「${label}講師」身分嗎？授權後系統將寄送通知信給該會員。`}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>取消</AlertDialogCancel>
                  <AlertDialogAction onClick={() => handle(role, !granted)}>
                    確認{granted ? '移除' : '授予'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )
      })}
    </div>
  )
}
