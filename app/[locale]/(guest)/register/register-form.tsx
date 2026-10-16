/*
 * ----------------------------------------------
 * 註冊表單（Client Component）
 * 2026-04-01
 * app/(auth)/register/register-form.tsx
 * ----------------------------------------------
 */

'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { signIn } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { FieldError } from '@/components/ui/field-error'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { registerSchema } from '@/lib/schemas/auth'
import { registerWithEmail } from '@/app/actions/auth'

// 表單輸入型別（birthYear 經 zod 轉換，輸入與輸出型別不同，比照 onboarding Step 2）
type RegisterFormInput = z.input<typeof registerSchema>
type RegisterFormOutput = z.output<typeof registerSchema>

export type RegisterPageChurch = { id: number; name: string }

// Google SVG icon
function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      className={className}
    >
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  )
}

export function RegisterForm({ churches }: { churches: RegisterPageChurch[] }) {
  const t = useTranslations()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [successOpen, setSuccessOpen] = useState(false)
  // 教會選單 value 格式：'' | 'other' | 'church:<id>'（比照 onboarding Step 2）
  const [churchSelect, setChurchSelect] = useState('')

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<RegisterFormInput, unknown, RegisterFormOutput>({
    resolver: zodResolver(registerSchema),
  })

  function handleChurchSelectChange(val: string) {
    setChurchSelect(val)
    if (val === 'other') {
      setValue('churchType', 'other')
      setValue('churchId', null)
    } else if (val.startsWith('church:')) {
      setValue('churchType', 'church')
      setValue('churchId', parseInt(val.replace('church:', ''), 10))
      setValue('churchOther', '')
    } else {
      // 空值：清掉 churchType 讓必填驗證攔截
      setValue('churchType', undefined as unknown as 'church')
      setValue('churchId', null)
    }
  }

  const onEmailSubmit = (data: RegisterFormOutput) => {
    startTransition(async () => {
      const formData = new FormData()
      formData.set('email', data.email)
      formData.set('realName', data.realName.trim())
      formData.set('phone', data.phone.trim())
      formData.set('gender', data.gender)
      formData.set('birthYear', String(data.birthYear))
      formData.set('churchType', data.churchType)
      formData.set('churchId', data.churchId ? String(data.churchId) : '')
      formData.set('churchOther', data.churchOther ?? '')
      const result = await registerWithEmail(formData)
      if (result.success) {
        setSuccessOpen(true)
      } else {
        const errKey =
          result.errors?.email?.[0] ??
          result.errors?.realName?.[0] ??
          result.errors?.phone?.[0] ??
          result.errors?.gender?.[0] ??
          result.errors?.birthYear?.[0] ??
          result.errors?.churchType?.[0] ??
          result.errors?.churchId?.[0] ??
          result.errors?.churchOther?.[0]
        toast.error(errKey ? t(errKey) : (result.message ?? t('account.register.failed')))
      }
    })
  }

  const handleGoogleSignUp = () => {
    startTransition(async () => {
      await signIn('google', { callbackUrl: '/dashboard' })
    })
  }

  const currentYear = new Date().getFullYear()
  const showOther = churchSelect === 'other'

  return (
    <div className="grid gap-6">
      {/* Email + 基本資料表單（姓名等基本資料須與 Email 同一次驗證通過才建立帳號） */}
      <form onSubmit={handleSubmit(onEmailSubmit)} className="grid gap-4">
        <div className="grid gap-1.5">
          <Label htmlFor="email" className="sr-only">Email</Label>
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

        <div className="grid gap-1.5">
          <Label htmlFor="realName">{t('onboarding.realName')}</Label>
          <Input
            id="realName"
            placeholder={t('onboarding.realNamePlaceholder')}
            autoComplete="name"
            disabled={isPending}
            {...register('realName')}
          />
          <FieldError message={errors.realName?.message} />
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="phone">{t('onboarding.phone')}</Label>
          <Input
            id="phone"
            type="tel"
            placeholder={t('onboarding.phonePlaceholder')}
            autoComplete="tel"
            disabled={isPending}
            {...register('phone')}
          />
          <FieldError message={errors.phone?.message} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="gender">{t('onboarding.gender')}</Label>
            <select
              id="gender"
              disabled={isPending}
              defaultValue=""
              className="h-9 rounded-md border px-3 py-1 text-sm bg-background"
              {...register('gender')}
            >
              <option value="" disabled>{t('onboarding.selectPlaceholder')}</option>
              <option value="male">{t('onboarding.male')}</option>
              <option value="female">{t('onboarding.female')}</option>
            </select>
            <FieldError message={errors.gender?.message} />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="birthYear">{t('onboarding.birthYear')}</Label>
            <Input
              id="birthYear"
              type="number"
              inputMode="numeric"
              placeholder={t('onboarding.birthYearPlaceholder', { year: currentYear })}
              min={1900}
              max={currentYear}
              disabled={isPending}
              {...register('birthYear')}
            />
            <FieldError message={errors.birthYear?.message} />
          </div>
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="church">{t('onboarding.church')}</Label>
          <select
            id="church"
            disabled={isPending}
            value={churchSelect}
            onChange={(e) => handleChurchSelectChange(e.target.value)}
            className="h-9 rounded-md border px-3 py-1 text-sm bg-background"
          >
            <option value="" disabled>{t('onboarding.selectPlaceholder')}</option>
            {churches.map((c) => (
              <option key={c.id} value={`church:${c.id}`}>{c.name}</option>
            ))}
            <option value="other">{t('onboarding.churchOther')}</option>
          </select>
          {showOther && (
            <Input
              placeholder={t('onboarding.churchOtherPlaceholder')}
              disabled={isPending}
              {...register('churchOther')}
            />
          )}
          <FieldError message={errors.churchType?.message} />
          <FieldError message={errors.churchId?.message} />
          <FieldError message={errors.churchOther?.message} />
        </div>

        <Button disabled={isPending}>
          {isPending ? t('account.register.submitting') : t('account.register.submit')}
        </Button>
      </form>

      {/* 分隔線 */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <Separator />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">{t('auth.orContinueWith')}</span>
        </div>
      </div>

      {/* Google 註冊 */}
      <Button
        variant="outline"
        type="button"
        disabled={isPending}
        onClick={handleGoogleSignUp}
      >
        <GoogleIcon className="mr-2 h-4 w-4" />
        {t('auth.continueWithGoogle')}
      </Button>

      {/* 註冊成功 Dialog */}
      <Dialog open={successOpen} onOpenChange={() => { }}>
        <DialogContent className="sm:max-w-sm" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>{t('account.register.successTitle')}</DialogTitle>
            <DialogDescription>
              {t('account.register.successDesc')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button className="w-full" onClick={() => router.push('/')}>
              {t('account.register.backToHome')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
