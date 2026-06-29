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
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FieldError } from '@/components/ui/field-error'
import { forgotPasswordSchema } from '@/lib/schemas/auth'
import { requestPasswordReset } from '@/app/actions/auth'

type ForgotForm = z.infer<typeof forgotPasswordSchema>

export function ForgotPasswordForm() {
  const t = useTranslations()
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
        <h1 className="text-2xl font-semibold tracking-tight">{t('account.forgot.sentTitle')}</h1>
        <p className="text-sm text-muted-foreground">
          {t('account.forgot.sentDesc')}
        </p>
        <Link
          href="/login"
          className="block text-sm font-medium underline underline-offset-4 hover:text-primary"
        >
          {t('common.backToLogin')}
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">{t('account.forgot.title')}</h1>
        <p className="text-sm text-muted-foreground">
          {t('account.forgot.subtitle')}
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
          <FieldError message={errors.email?.message} />
        </div>
        <Button disabled={isPending}>
          {isPending ? t('account.forgot.submitting') : t('account.forgot.submit')}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        {t('account.forgot.rememberedQ')}{' '}
        <Link
          href="/login"
          className="font-medium underline underline-offset-4 hover:text-primary"
        >
          {t('common.backToLogin')}
        </Link>
      </p>
    </div>
  )
}
