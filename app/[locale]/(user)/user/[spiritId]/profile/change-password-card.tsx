/*
 * ----------------------------------------------
 * ChangePasswordCard - 會員主動變更密碼
 * 2026-04-07 (Updated: 2026-09-03)
 * app/(user)/user/[spiritId]/profile/change-password-card.tsx
 *
 * cr-spec-260903-001：卡片內寫死字串改以 profile i18n 命名空間取用
 * ----------------------------------------------
 */

'use client'

import { useTransition, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import { IconEye, IconEyeOff } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FieldError } from '@/components/ui/field-error'
import { changePasswordSchema } from '@/lib/schemas/auth'
import { changePassword } from '@/app/actions/auth'

type ChangeForm = z.infer<typeof changePasswordSchema>

export function ChangePasswordCard() {
  const t = useTranslations()
  const [isPending, startTransition] = useTransition()
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ChangeForm>({
    resolver: zodResolver(changePasswordSchema),
  })

  const onSubmit = (data: ChangeForm) => {
    startTransition(async () => {
      const formData = new FormData()
      formData.set('currentPassword', data.currentPassword)
      formData.set('newPassword', data.newPassword)
      formData.set('confirmPassword', data.confirmPassword)
      const result = await changePassword(formData)
      if (result.success) {
        toast.success(t(result.message ?? 'profile.toast.passwordUpdated'))
        reset()
      } else {
        const errKey = result.errors?.currentPassword?.[0] ?? result.errors?.newPassword?.[0]
        toast.error(errKey ? t(errKey) : (result.message ? t(result.message) : t('profile.toast.formHasErrors')))
      }
    })
  }

  return (
    <div className="rounded-lg border p-5 space-y-4">
      <h2 className="text-sm font-medium text-muted-foreground">{t('profile.changePasswordTitle')}</h2>

      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
        {/* 目前密碼 */}
        <div className="grid gap-1.5">
          <Label htmlFor="cp-currentPassword">{t('profile.changePasswordCurrent')}</Label>
          <div className="relative">
            <Input
              id="cp-currentPassword"
              type={showCurrent ? 'text' : 'password'}
              placeholder={t('profile.changePasswordCurrentPlaceholder')}
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
            <FieldError message={errors.currentPassword?.message} />
          )}
        </div>

        {/* 新密碼 */}
        <div className="grid gap-1.5">
          <Label htmlFor="cp-newPassword">{t('profile.changePasswordNew')}</Label>
          <div className="relative">
            <Input
              id="cp-newPassword"
              type={showNew ? 'text' : 'password'}
              placeholder={t('profile.changePasswordNewPlaceholder')}
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
            <FieldError message={errors.newPassword?.message} />
          )}
        </div>

        {/* 確認新密碼 */}
        <div className="grid gap-1.5">
          <Label htmlFor="cp-confirmPassword">{t('profile.changePasswordConfirm')}</Label>
          <div className="relative">
            <Input
              id="cp-confirmPassword"
              type={showConfirm ? 'text' : 'password'}
              placeholder={t('profile.changePasswordConfirmPlaceholder')}
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
            <FieldError message={errors.confirmPassword?.message} />
          )}
        </div>

        <Button type="submit" disabled={isPending} className="w-fit">
          {isPending ? t('profile.changePasswordSubmitting') : t('profile.changePasswordSubmit')}
        </Button>
      </form>
    </div>
  )
}
