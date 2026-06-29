/*
 * ----------------------------------------------
 * ForgotPasswordForm - 忘記密碼表單（Client Component）
 * 2026-04-07
 * app/(auth)/forgot-password/forgot-password-form.tsx
 * ----------------------------------------------
 */

'use client'

import { useTransition, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { forgotPasswordSchema } from '@/lib/schemas/auth'
import { requestPasswordReset } from '@/app/actions/auth'

type ForgotForm = z.infer<typeof forgotPasswordSchema>

export function ForgotPasswordForm() {
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
      <div className="space-y-4 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">重設信已發送</h1>
        <p className="text-sm text-muted-foreground">
          若此 Email 已註冊，將發送密碼重設信至您的信箱。
        </p>
        <Link
          href="/login"
          className="block text-sm font-medium underline underline-offset-4 hover:text-primary"
        >
          返回登入
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">忘記密碼</h1>
        <p className="text-sm text-muted-foreground">
          輸入您的 Email，我們將發送密碼重設連結
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
        <div className="grid gap-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="name@example.com"
            autoCapitalize="none"
            autoComplete="email"
            autoCorrect="off"
            disabled={isPending}
            {...register('email')}
          />
          {errors.email && (
            <p className="text-xs text-destructive">{errors.email.message}</p>
          )}
        </div>
        <Button disabled={isPending}>
          {isPending ? '發送中...' : '發送重設連結'}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        想起密碼了？{' '}
        <Link
          href="/login"
          className="font-medium underline underline-offset-4 hover:text-primary"
        >
          返回登入
        </Link>
      </p>
    </div>
  )
}
