/*
 * ----------------------------------------------
 * 會員特殊身分授權（admin / superadmin）（Client Component）
 * 2026-06-22
 * components/admin/member-special-roles.tsx
 *
 * 權限分級：非 superadmin 的操作者不顯示 superadmin 選項。
 * 防鎖死：本人不可移除自己的 admin / superadmin。
 * ----------------------------------------------
 */

'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { ROLE_LABELS } from '@/lib/auth-roles'
import { updateMemberRoles } from '@/app/actions/admin'

type Props = {
  userId: string
  roles: string[]
  isSelf: boolean
  actorIsSuperadmin: boolean
}

export function MemberSpecialRoles({ userId, roles, isSelf, actorIsSuperadmin }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  // 可操作的特殊身分：admin 一律可；superadmin 僅 superadmin 操作者可見
  const editable: ('admin' | 'superadmin')[] = actorIsSuperadmin ? ['admin', 'superadmin'] : ['admin']
  const [selected, setSelected] = useState<string[]>(roles)

  const dirty = editable.some((r) => roles.includes(r) !== selected.includes(r))

  const toggle = (role: string, checked: boolean) =>
    setSelected((prev) => (checked ? [...prev, role] : prev.filter((r) => r !== role)))

  const isLockedForSelf = (role: string) =>
    isSelf && (role === 'admin' || role === 'superadmin') && roles.includes(role)

  const handleSave = () => {
    startTransition(async () => {
      const res = await updateMemberRoles(userId, selected)
      if (res.success) {
        toast.success(res.message ?? '身分已更新')
        router.refresh()
      } else {
        toast.error(res.message ?? '更新失敗，請稍後再試')
      }
    })
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-4">
        {editable.map((role) => (
          <label key={role} className="flex items-center gap-1.5 text-sm">
            <Checkbox
              checked={selected.includes(role)}
              disabled={isPending || isLockedForSelf(role)}
              onCheckedChange={(c) => toggle(role, c === true)}
            />
            {ROLE_LABELS[role]}
          </label>
        ))}
      </div>
      {!actorIsSuperadmin && (
        <p className="text-xs text-muted-foreground">※ 僅超級管理者可授權「超級管理者」身分。</p>
      )}
      {dirty && (
        <Button size="sm" onClick={handleSave} disabled={isPending}>
          {isPending ? '儲存中…' : '儲存特殊身分'}
        </Button>
      )}
    </div>
  )
}
