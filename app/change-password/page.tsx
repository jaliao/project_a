/*
 * ----------------------------------------------
 * 強制變更臨時密碼頁面
 * 2026-03-23
 * app/change-password/page.tsx
 *
 * 此頁面不含 sidebar layout（獨立全版面）
 * isTempPassword = true 時 middleware 強制導向此頁
 * ----------------------------------------------
 */

'use client'

import { useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { changePasswordSchema } from '@/lib/schemas/auth'
import { changeTempPassword } from '@/app/actions/auth'

type ChangeForm = z.infer<typeof changePasswordSchema>

export default function ChangePasswordPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
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
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-md space-y-6 p-8 rounded-lg border shadow-sm">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold">請設定您的新密碼</h1>
          <p className="text-muted-foreground text-sm">
            您的帳號使用的是臨時密碼，請立即設定新密碼以繼續使用系統。
          </p>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">目前（臨時）密碼</label>
            <input
              {...register('currentPassword')}
              type="password"
              className="w-full rounded-md border px-3 py-2"
              disabled={isPending}
            />
            {errors.currentPassword && (
              <p className="text-sm text-red-500 mt-1">{errors.currentPassword.message}</p>
            )}
          </div>
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
