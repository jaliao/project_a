/*
 * ----------------------------------------------
 * 註冊頁面
 * 2026-03-23
 * app/(auth)/register/page.tsx
 * ----------------------------------------------
 */

'use client'

import { useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { toast } from 'sonner'
import { registerSchema } from '@/lib/schemas/auth'
import { registerWithEmail } from '@/app/actions/auth'

type RegisterForm = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const [isPending, startTransition] = useTransition()
  const { register, handleSubmit, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  })

  const onSubmit = (data: RegisterForm) => {
    startTransition(async () => {
      const formData = new FormData()
      formData.set('email', data.email)
      const result = await registerWithEmail(formData)
      if (result.success) {
        toast.success(result.message ?? '帳號建立成功')
      } else {
        toast.error(result.errors?.email?.[0] ?? result.message ?? '註冊失敗')
      }
    })
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md space-y-6 p-8">
        <h1 className="text-2xl font-bold text-center">建立帳號</h1>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              {...register('email')}
              type="email"
              className="w-full rounded-md border px-3 py-2"
              placeholder="your@email.com"
              disabled={isPending}
            />
            {errors.email && (
              <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>
            )}
          </div>
          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded-md bg-primary px-4 py-2 text-white disabled:opacity-50"
          >
            {isPending ? '建立中...' : '建立帳號'}
          </button>
        </form>
        <p className="text-center text-sm text-muted-foreground">
          已有帳號？{' '}
          <Link href="/login" className="underline">
            登入
          </Link>
        </p>
      </div>
    </div>
  )
}
