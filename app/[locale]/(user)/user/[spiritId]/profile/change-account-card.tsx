/*
 * ----------------------------------------------
 * ChangeAccountCard - 帳號修改卡（登入 Email 變更／設定初始密碼）
 * 2026-07-14 (Updated: 2026-10-21)
 * app/[locale]/(user)/user/[spiritId]/profile/change-account-card.tsx
 *
 * 有密碼者：新 email＋目前密碼＋確認視窗後立即生效；
 * 尚未設定密碼者（Google-only／LINE-only）：提供「設定登入密碼」表單（cr-feat-261021-004）。
 * cr-spec-260903-001：字串改以 profile i18n 命名空間取用；action 訊息以 t() 呈現
 * ----------------------------------------------
 */

'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import { IconAt, IconEye, IconEyeOff } from '@tabler/icons-react'
import { changeMyAccountEmail } from '@/app/actions/profile'
import { setInitialPassword } from '@/app/actions/auth'
import { setInitialPasswordSchema } from '@/lib/schemas/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FieldError } from '@/components/ui/field-error'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

type InitialPasswordForm = z.infer<typeof setInitialPasswordSchema>

// 尚未設定密碼（Google-only／LINE-only）：提供自助設定初始密碼表單
function SetInitialPasswordForm() {
  const t = useTranslations()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<InitialPasswordForm>({
    resolver: zodResolver(setInitialPasswordSchema),
  })

  const onSubmit = (data: InitialPasswordForm) => {
    startTransition(async () => {
      const formData = new FormData()
      formData.set('newPassword', data.newPassword)
      formData.set('confirmPassword', data.confirmPassword)
      const result = await setInitialPassword(formData)
      if (result.success) {
        toast.success(result.message ? t(result.message) : t('profile.toast.passwordUpdated'))
        router.refresh()
      } else {
        const errKey = result.errors?.newPassword?.[0] ?? result.errors?.confirmPassword?.[0]
        toast.error(errKey ? t(errKey) : (result.message ? t(result.message) : t('profile.toast.formHasErrors')))
      }
    })
  }

  return (
    <div className="rounded-lg border p-4 space-y-4">
      <div className="flex items-center gap-2">
        <IconAt className="h-5 w-5 text-primary" />
        <h2 className="text-base font-semibold">{t('profile.setPasswordTitle')}</h2>
      </div>
      <p className="text-sm text-muted-foreground">
        {t('profile.setPasswordDesc')}
      </p>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="initial-newPassword">{t('onboarding.newPassword')}</Label>
          <div className="relative">
            <Input
              id="initial-newPassword"
              type={showNew ? 'text' : 'password'}
              placeholder={t('onboarding.newPasswordPlaceholder')}
              autoComplete="new-password"
              disabled={isPending}
              className="pr-10"
              {...register('newPassword')}
            />
            <button type="button" onClick={() => setShowNew(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" tabIndex={-1}>
              {showNew ? <IconEyeOff className="h-4 w-4" /> : <IconEye className="h-4 w-4" />}
            </button>
          </div>
          <FieldError message={errors.newPassword?.message} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="initial-confirmPassword">{t('onboarding.confirmPassword')}</Label>
          <div className="relative">
            <Input
              id="initial-confirmPassword"
              type={showConfirm ? 'text' : 'password'}
              placeholder={t('onboarding.confirmPlaceholder')}
              autoComplete="new-password"
              disabled={isPending}
              className="pr-10"
              {...register('confirmPassword')}
            />
            <button type="button" onClick={() => setShowConfirm(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" tabIndex={-1}>
              {showConfirm ? <IconEyeOff className="h-4 w-4" /> : <IconEye className="h-4 w-4" />}
            </button>
          </div>
          <FieldError message={errors.confirmPassword?.message} />
        </div>
        <Button type="submit" disabled={isPending}>
          {isPending ? t('onboarding.settingUp') : t('profile.setPasswordSubmit')}
        </Button>
      </form>
    </div>
  )
}

export function ChangeAccountCard({
  currentEmail,
  hasPassword,
}: {
  currentEmail: string | null
  hasPassword: boolean
}) {
  const t = useTranslations()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [newEmail, setNewEmail] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const [confirmOpen, setConfirmOpen] = useState(false)

  // 尚未設定密碼（Google-only／LINE-only）：提供自助設定初始密碼
  if (!hasPassword) {
    return <SetInitialPasswordForm />
  }

  const handleSubmit = () => {
    setErrors({})
    startTransition(async () => {
      const res = await changeMyAccountEmail(newEmail, currentPassword)
      setConfirmOpen(false)
      if (res.success) {
        toast.success(t(res.message ?? 'profile.toast.accountEmailUpdated'))
        setNewEmail('')
        setCurrentPassword('')
        router.refresh()
      } else {
        if (res.errors) setErrors(res.errors)
        if (res.message) toast.error(t(res.message))
      }
    })
  }

  const canOpenConfirm = newEmail.trim() !== '' && currentPassword !== ''

  return (
    <div className="rounded-lg border p-4 space-y-4">
      <div className="flex items-center gap-2">
        <IconAt className="h-5 w-5 text-primary" />
        <h2 className="text-base font-semibold">{t('profile.changeAccountTitle')}</h2>
      </div>
      <p className="text-sm text-muted-foreground">
        {t('profile.changeAccountDesc')}<span className="font-medium">{currentEmail ?? t('profile.changeAccountNoneYet')}</span>
      </p>
      <div className="space-y-1.5">
        <Label htmlFor="account-new-email">{t('profile.changeAccountNewEmail')}</Label>
        <Input
          id="account-new-email"
          type="email"
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          placeholder={t('profile.placeholderNewEmail')}
        />
        {errors.email?.[0] && <p className="text-sm text-destructive">{t(errors.email[0])}</p>}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="account-current-password">{t('profile.changeAccountCurrentPassword')}</Label>
        <Input
          id="account-current-password"
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
        />
        {errors.currentPassword?.[0] && (
          <p className="text-sm text-destructive">{t(errors.currentPassword[0])}</p>
        )}
      </div>
      <Button onClick={() => setConfirmOpen(true)} disabled={!canOpenConfirm || isPending}>
        {t('profile.changeAccountSubmit')}
      </Button>

      {/* 確認視窗：新舊 email 並列＋下次登入提醒 */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('profile.changeAccountConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <p>
                  <span className="text-muted-foreground">{t('profile.changeAccountConfirmCurrent')}</span>
                  {currentEmail ?? t('profile.changeAccountNoneYet')}
                </p>
                <p>
                  <span className="text-muted-foreground">{t('profile.changeAccountConfirmNew')}</span>
                  <span className="font-semibold">{newEmail.trim().toLowerCase()}</span>
                </p>
                <p className="text-amber-700">
                  {t('profile.changeAccountConfirmWarn')}
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleSubmit} disabled={isPending}>
              {isPending ? t('profile.processing') : t('profile.changeAccountConfirmSubmit')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
