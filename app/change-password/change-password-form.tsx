/*
 * ----------------------------------------------
 * ChangePasswordForm - 首次登入設定密碼表單（Client Component）
 * 2026-04-07
 * app/change-password/change-password-form.tsx
 * ----------------------------------------------
 */

'use client'

import { useTransition, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { IconEye, IconEyeOff } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { changePasswordSchema } from '@/lib/schemas/auth'
import { changeTempPassword } from '@/app/actions/auth'

type ChangeForm = z.infer<typeof changePasswordSchema>

export function ChangePasswordForm() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<ChangeForm>({
    resolver: zodResolver(changePasswordSchema),
  })

  const onSubmit = (data: ChangeForm) => {
    startTransition(async () => {
      const formData = new FormData()
      formData.set('currentPassword', data.currentPassword)
      formData.set('newPassword', data.newPassword)
      formData.set('confirmPassword', data.confirmPassword)
      const result = await changeTempPassword(formData)
      if (result.success) {
        toast.success(result.message ?? '密碼已更新')
        const spiritId = result.data?.spiritId as string | undefined
        router.push(spiritId ? `/user/${spiritId.toLowerCase()}/profile` : '/profile')
        router.refresh()
      } else {
        const errMsg =
          result.errors?.currentPassword?.[0] ??
          result.errors?.newPassword?.[0] ??
          result.message ??
          '更新失敗'
        toast.error(errMsg)
      }
    })
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          第一次登入？請設定您的密碼
        </h1>
        <p className="text-sm text-muted-foreground">
          您的帳號使用的是臨時密碼，請立即設定新密碼以繼續使用系統。
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
        {/* 目前（臨時）密碼 */}
        <div className="grid gap-1.5">
          <Label htmlFor="currentPassword">目前（臨時）密碼</Label>
          <div className="relative">
            <Input
              id="currentPassword"
              type={showCurrent ? 'text' : 'password'}
              placeholder="輸入臨時密碼"
              autoComplete="current-password"
              disabled={isPending}
              className="pr-10"
              {...register('currentPassword')}
            />
            <button
              type="button"
              onClick={() => setShowCurrent((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              tabIndex={-1}
            >
              {showCurrent ? <IconEyeOff className="h-4 w-4" /> : <IconEye className="h-4 w-4" />}
            </button>
          </div>
          {errors.currentPassword && (
            <p className="text-xs text-destructive">{errors.currentPassword.message}</p>
          )}
        </div>

        {/* 新密碼 */}
        <div className="grid gap-1.5">
          <Label htmlFor="newPassword">新密碼</Label>
          <div className="relative">
            <Input
              id="newPassword"
              type={showNew ? 'text' : 'password'}
              placeholder="至少 8 個字元"
              autoComplete="new-password"
              disabled={isPending}
              className="pr-10"
              {...register('newPassword')}
            />
            <button
              type="button"
              onClick={() => setShowNew((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              tabIndex={-1}
            >
              {showNew ? <IconEyeOff className="h-4 w-4" /> : <IconEye className="h-4 w-4" />}
            </button>
          </div>
          {errors.newPassword && (
            <p className="text-xs text-destructive">{errors.newPassword.message}</p>
          )}
        </div>

        {/* 確認新密碼 */}
        <div className="grid gap-1.5">
          <Label htmlFor="confirmPassword">確認新密碼</Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirm ? 'text' : 'password'}
              placeholder="再次輸入新密碼"
              autoComplete="new-password"
              disabled={isPending}
              className="pr-10"
              {...register('confirmPassword')}
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              tabIndex={-1}
            >
              {showConfirm ? <IconEyeOff className="h-4 w-4" /> : <IconEye className="h-4 w-4" />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
          )}
        </div>

        <Button disabled={isPending}>
          {isPending ? '更新中...' : '確認設定新密碼'}
        </Button>
      </form>
    </div>
  )
}
