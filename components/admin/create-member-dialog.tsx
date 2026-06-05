/*
 * ----------------------------------------------
 * 後台新增會員 Dialog（Client Component）
 * 2026-06-05
 * components/admin/create-member-dialog.tsx
 * ----------------------------------------------
 */

'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { ASSIGNABLE_ROLES, ROLE_LABELS } from '@/lib/auth-roles'
import { createMember } from '@/app/actions/admin'

export function CreateMemberDialog() {
  const [open, setOpen] = useState(false)
  const [realName, setRealName] = useState('')
  const [email, setEmail] = useState('')
  const [roles, setRoles] = useState<string[]>([])
  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const [result, setResult] = useState<{ tempPassword: string; spiritId: string } | null>(null)
  const [isPending, startTransition] = useTransition()

  const toggleRole = (role: string, checked: boolean) => {
    setRoles((prev) => (checked ? [...prev, role] : prev.filter((r) => r !== role)))
  }

  const reset = () => {
    setRealName('')
    setEmail('')
    setRoles([])
    setErrors({})
    setResult(null)
  }

  const handleSubmit = () => {
    setErrors({})
    startTransition(async () => {
      const res = await createMember({ realName, email, roles })
      if (res.success && res.data) {
        setResult(res.data)
        toast.success('會員已建立')
      } else if (res.errors) {
        setErrors(res.errors)
      } else {
        toast.error(res.message ?? '建立失敗，請稍後再試')
      }
    })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o)
        if (!o) reset()
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm">新增會員</Button>
      </DialogTrigger>
      <DialogContent>
        {result ? (
          // ── 建立成功：顯示臨時密碼（僅顯示一次）──
          <>
            <DialogHeader>
              <DialogTitle>會員已建立</DialogTitle>
              <DialogDescription>
                請將以下臨時密碼轉交給會員，此密碼僅顯示一次。會員首次登入須變更密碼。
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <div className="rounded-md border bg-muted/40 p-3 text-sm">
                <div>啟動編號：<span className="font-mono">{result.spiritId}</span></div>
                <div className="mt-1">
                  臨時密碼：<span className="font-mono font-semibold">{result.tempPassword}</span>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => setOpen(false)}>關閉</Button>
            </DialogFooter>
          </>
        ) : (
          // ── 新增會員表單 ──
          <>
            <DialogHeader>
              <DialogTitle>新增會員</DialogTitle>
              <DialogDescription>
                建立可登入的會員，系統將核發啟動編號並產生臨時密碼。
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label htmlFor="realName">姓名</Label>
                <Input
                  id="realName"
                  value={realName}
                  onChange={(e) => setRealName(e.target.value)}
                  placeholder="請輸入姓名"
                />
                {errors.realName && (
                  <p className="text-xs text-red-500">{errors.realName[0]}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="登入用 Email"
                />
                {errors.email && <p className="text-xs text-red-500">{errors.email[0]}</p>}
              </div>
              <div className="space-y-2">
                <Label>身分（一般會員為預設基線）</Label>
                <div className="flex flex-col gap-2">
                  {ASSIGNABLE_ROLES.map((role) => (
                    <label key={role} className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={roles.includes(role)}
                        onCheckedChange={(c) => toggleRole(role, c === true)}
                      />
                      {ROLE_LABELS[role]}
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
                取消
              </Button>
              <Button onClick={handleSubmit} disabled={isPending}>
                {isPending ? '建立中…' : '建立會員'}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
