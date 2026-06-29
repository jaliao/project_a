/*
 * ----------------------------------------------
 * ResetPasswordForm - 設定新密碼表單（Client Component）
 * 2026-04-07
 * app/(auth)/reset-password/reset-password-form.tsx
 * ----------------------------------------------
 */

'use client'

import { useTransition, useState, Suspense } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { IconEye, IconEyeOff } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { resetPasswordSchema } from '@/lib/schemas/auth'
import { resetPassword } from '@/app/actions/auth'

type ResetForm = z.infer<typeof resetPasswordSchema>

function ResetForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const [isPending, startTransition] = useTransition()
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<ResetForm>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { token },
  })

  const onSubmit = (data: ResetForm) => {
    startTransition(async () => {
      const formData = new FormData()
      formData.set('token', data.token)
      formData.set('newPassword', data.newPassword)
      formData.set('confirmPassword', data.confirmPassword)
      const result = await resetPassword(formData)
      if (result.success) {
        toast.success(result.message ?? '密碼已重設')
        router.push('/login')
      } else {
        toast.error(result.message ?? '重設失敗，請重新申請')
      }
    })
  }

  if (!token) {
    return (
      <div className="space-y-4 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">連結無效</h1>
        <p className="text-sm text-muted-foreground">
          此密碼重設連結無效或已失效。
        </p>
        <Link
          href="/forgot-password"
          className="block text-sm font-medium underline underline-offset-4 hover:text-primary"
        >
          重新申請密碼重設
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">設定新密碼</h1>
        <p className="text-sm text-muted-foreground">
          請輸入您的新密碼
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
        <input type="hidden" {...register('token')} />

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

export function ResetPasswordForm() {
  return (
    <Suspense>
      <ResetForm />
    </Suspense>
  )
}
