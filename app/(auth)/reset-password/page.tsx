/*
 * ----------------------------------------------
 * 密碼重設頁面
 * 2026-03-23
 * app/(auth)/reset-password/page.tsx
 * ----------------------------------------------
 */

'use client'

import { useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { resetPasswordSchema } from '@/lib/schemas/auth'
import { resetPassword } from '@/app/actions/auth'
import { Suspense } from 'react'

type ResetForm = z.infer<typeof resetPasswordSchema>

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const [isPending, startTransition] = useTransition()

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
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center space-y-4 p-8">
          <p className="text-destructive">無效的連結</p>
          <Link href="/forgot-password" className="underline text-sm">
            重新申請密碼重設
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md space-y-6 p-8">
        <h1 className="text-2xl font-bold text-center">設定新密碼</h1>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <input type="hidden" {...register('token')} />
          <div>
            <label className="block text-sm font-medium mb-1">新密碼</label>
            <input
              {...register('newPassword')}
              type="password"
              className="w-full rounded-md border px-3 py-2"
              disabled={isPending}
            />
            {errors.newPassword && (
              <p className="text-sm text-red-500 mt-1">{errors.newPassword.message}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">確認新密碼</label>
            <input
              {...register('confirmPassword')}
              type="password"
              className="w-full rounded-md border px-3 py-2"
              disabled={isPending}
            />
            {errors.confirmPassword && (
              <p className="text-sm text-red-500 mt-1">{errors.confirmPassword.message}</p>
            )}
          </div>
          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded-md bg-primary px-4 py-2 text-white disabled:opacity-50"
          >
            {isPending ? '更新中...' : '確認設定新密碼'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  )
}
