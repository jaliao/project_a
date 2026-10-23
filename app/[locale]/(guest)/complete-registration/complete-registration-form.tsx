/*
 * ----------------------------------------------
 * CompleteRegistrationForm - 完成註冊設定密碼表單（Client Component）
 * 2026-10-22
 * app/[locale]/(guest)/complete-registration/complete-registration-form.tsx
 * ----------------------------------------------
 */

'use client'

import { useTransition, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import { IconEye, IconEyeOff } from '@tabler/icons-react'
import { FieldError } from '@/components/ui/field-error'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { completeRegistrationSchema } from '@/lib/schemas/auth'
import { completeProxyRegistration } from '@/app/actions/auth'

type CompleteForm = z.infer<typeof completeRegistrationSchema>

export function CompleteRegistrationForm({ token }: { token: string }) {
  const t = useTranslations()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<CompleteForm>({
    resolver: zodResolver(completeRegistrationSchema),
    defaultValues: { token },
  })

  const onSubmit = (data: CompleteForm) => {
    startTransition(async () => {
      const formData = new FormData()
      formData.set('token', data.token)
      formData.set('newPassword', data.newPassword)
      formData.set('confirmPassword', data.confirmPassword)
      const result = await completeProxyRegistration(formData)
      if (result.success) {
        toast.success(result.message ?? t('account.completeRegistration.doneTitle'))
        router.push('/login')
      } else {
        toast.error(result.message ?? t('account.completeRegistration.failed'))
      }
    })
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">{t('account.completeRegistration.title')}</h1>
        <p className="text-sm text-muted-foreground">
          {t('account.completeRegistration.subtitle')}
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
        <input type="hidden" {...register('token')} />

        <div className="grid gap-1.5">
          <Label htmlFor="newPassword">{t('account.completeRegistration.newPassword')}</Label>
          <div className="relative">
            <Input
              id="newPassword"
              type={showNew ? 'text' : 'password'}
              placeholder={t('account.completeRegistration.newPasswordPlaceholder')}
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
          <Label htmlFor="confirmPassword">{t('account.completeRegistration.confirmNewPassword')}</Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirm ? 'text' : 'password'}
              placeholder={t('account.completeRegistration.confirmPlaceholder')}
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
          {isPending ? t('account.completeRegistration.submitting') : t('account.completeRegistration.submit')}
        </Button>
      </form>
    </div>
  )
}
