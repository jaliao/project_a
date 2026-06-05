/*
 * ----------------------------------------------
 * 會員身分編輯器（Client Component）
 * 2026-06-05
 * components/admin/member-roles-editor.tsx
 *
 * 多重身分複選編輯；user 為基線不可變更。
 * 防鎖死：管理者不可移除自己的 admin / superadmin 身分。
 * ----------------------------------------------
 */

'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ASSIGNABLE_ROLES, ROLE_LABELS } from '@/lib/auth-roles'
import { updateMemberRoles } from '@/app/actions/admin'

interface MemberRolesEditorProps {
  userId: string
  roles: string[]
  isSelf: boolean
}

export function MemberRolesEditor({ userId, roles, isSelf }: MemberRolesEditorProps) {
  const [selected, setSelected] = useState<string[]>(roles)
  const [isPending, startTransition] = useTransition()

  const dirty =
    selected.length !== roles.length || selected.some((r) => !roles.includes(r))

  const toggle = (role: string, checked: boolean) => {
    setSelected((prev) => (checked ? [...prev, role] : prev.filter((r) => r !== role)))
  }

  // 防鎖死：本人不可取消自己既有的 admin / superadmin
  const isLockedForSelf = (role: string) =>
    isSelf && (role === 'admin' || role === 'superadmin') && roles.includes(role)

  const handleSave = () => {
    startTransition(async () => {
      const res = await updateMemberRoles(userId, selected)
      if (res.success) {
        toast.success(res.message ?? '身分已更新')
      } else {
        toast.error(res.message ?? '更新失敗，請稍後再試')
      }
    })
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary" className="text-xs">{ROLE_LABELS.user}</Badge>
        {ASSIGNABLE_ROLES.map((role) => (
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
      {dirty && (
        <Button size="sm" onClick={handleSave} disabled={isPending}>
          {isPending ? '儲存中…' : '儲存身分'}
        </Button>
      )}
    </div>
  )
}
