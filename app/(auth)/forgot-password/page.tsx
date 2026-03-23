/*
 * ----------------------------------------------
 * 忘記密碼頁面
 * 2026-03-23
 * app/(auth)/forgot-password/page.tsx
 * ----------------------------------------------
 */

'use client'

import { useTransition, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { forgotPasswordSchema } from '@/lib/schemas/auth'
import { requestPasswordReset } from '@/app/actions/auth'

type ForgotForm = z.infer<typeof forgotPasswordSchema>

export default function ForgotPasswordPage() {
  const [isPending, startTransition] = useTransition()
  const [submitted, setSubmitted] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm<ForgotForm>({
    resolver: zodResolver(forgotPasswordSchema),
  })

  const onSubmit = (data: ForgotForm) => {
    startTransition(async () => {
      const formData = new FormData()
      formData.set('email', data.email)
      await requestPasswordReset(formData)
      setSubmitted(true)
    })
  }

  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="w-full max-w-md space-y-4 p-8 text-center">
          <h1 className="text-2xl font-bold">已發送重設信</h1>
          <p className="text-muted-foreground">
            若此 Email 已註冊，將發送密碼重設信至您的信箱。
          </p>
          <Link href="/login" className="text-sm underline">
            返回登入
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md space-y-6 p-8">
        <h1 className="text-2xl font-bold text-center">忘記密碼</h1>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              {...register('email')}
              type="email"
              className="w-full rounded-md border px-3 py-2"
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
            {isPending ? '發送中...' : '發送重設連結'}
          </button>
        </form>
        <p className="text-center text-sm">
          <Link href="/login" className="underline text-muted-foreground">
            返回登入
          </Link>
        </p>
      </div>
    </div>
  )
}
