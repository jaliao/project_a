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
import { useTranslations } from 'next-intl'
import { IconEye, IconEyeOff } from '@tabler/icons-react'
import { FieldError } from '@/components/ui/field-error'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { resetPasswordSchema } from '@/lib/schemas/auth'
import { resetPassword } from '@/app/actions/auth'

type ResetForm = z.infer<typeof resetPasswordSchema>

function ResetForm() {
  const t = useTranslations()
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
        toast.success(result.message ?? t('account.reset.doneTitle'))
        router.push('/login')
      } else {
        toast.error(result.message ?? t('account.reset.failed'))
      }
    })
  }

  if (!token) {
    return (
      <div className="space-y-4 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">{t('account.reset.invalidTitle')}</h1>
        <p className="text-sm text-muted-foreground">
          {t('account.reset.invalidDesc')}
        </p>
        <Link
          href="/forgot-password"
          className="block text-sm font-medium underline underline-offset-4 hover:text-primary"
        >
          {t('account.reset.requestNew')}
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">{t('account.reset.title')}</h1>
        <p className="text-sm text-muted-foreground">
          {t('account.reset.subtitle')}
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
        <input type="hidden" {...register('token')} />

        <div className="grid gap-1.5">
          <Label htmlFor="newPassword">{t('account.reset.newPassword')}</Label>
          <div className="relative">
            <Input
              id="newPassword"
              type={showNew ? 'text' : 'password'}
              placeholder={t('account.reset.newPasswordPlaceholder')}
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
          <FieldError message={errors.newPassword?.message} />
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="confirmPassword">{t('account.reset.confirmNewPassword')}</Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirm ? 'text' : 'password'}
              placeholder={t('account.reset.confirmPlaceholder')}
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
          <FieldError message={errors.confirmPassword?.message} />
        </div>

        <Button disabled={isPending}>
          {isPending ? t('account.reset.submitting') : t('account.reset.submit')}
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
