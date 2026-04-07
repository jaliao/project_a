/*
 * ----------------------------------------------
 * OnboardingWizard - 首次登入三步驟引導
 * 2026-04-07
 * app/onboarding/onboarding-wizard.tsx
 * ----------------------------------------------
 */

'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { IconEye, IconEyeOff, IconCheck } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { changePasswordSchema } from '@/lib/schemas/auth'
import { changeTempPassword, completeOnboardingProfile } from '@/app/actions/auth'

type PasswordForm = z.infer<typeof changePasswordSchema>

// ── 步驟進度指示 ───────────────────────────────
function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {Array.from({ length: total }, (_, i) => {
        const step = i + 1
        const isDone = step < current
        const isActive = step === current
        return (
          <div key={step} className="flex items-center gap-2">
            <div
              className={`
                flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-colors
                ${isDone ? 'bg-primary text-primary-foreground' : ''}
                ${isActive ? 'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2' : ''}
                ${!isDone && !isActive ? 'bg-muted text-muted-foreground' : ''}
              `}
            >
              {isDone ? <IconCheck className="h-3.5 w-3.5" /> : step}
            </div>
            {step < total && (
              <div className={`h-px w-8 ${isDone ? 'bg-primary' : 'bg-muted'}`} />
            )}
          </div>
        )
      })}
      <span className="ml-2 text-xs text-muted-foreground">{current} / {total}</span>
    </div>
  )
}

// ── Step 1：設定密碼 ──────────────────────────
function Step1Password({ onSuccess }: { onSuccess: (spiritId: string) => void }) {
  const [isPending, startTransition] = useTransition()
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<PasswordForm>({
    resolver: zodResolver(changePasswordSchema),
  })

  const onSubmit = (data: PasswordForm) => {
    startTransition(async () => {
      const formData = new FormData()
      formData.set('currentPassword', data.currentPassword)
      formData.set('newPassword', data.newPassword)
      formData.set('confirmPassword', data.confirmPassword)
      const result = await changeTempPassword(formData)
      if (result.success) {
        const spiritId = (result.data?.spiritId as string | null | undefined) ?? ''
        onSuccess(spiritId)
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
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
      {/* 目前密碼（臨時密碼） */}
      <div className="grid gap-1.5">
        <Label htmlFor="ob-currentPassword">臨時密碼</Label>
        <div className="relative">
          <Input
            id="ob-currentPassword"
            type={showCurrent ? 'text' : 'password'}
            placeholder="輸入信件中的臨時密碼"
            autoComplete="current-password"
            disabled={isPending}
            className="pr-10"
            {...register('currentPassword')}
          />
          <button type="button" onClick={() => setShowCurrent(v => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" tabIndex={-1}>
            {showCurrent ? <IconEyeOff className="h-4 w-4" /> : <IconEye className="h-4 w-4" />}
          </button>
        </div>
        {errors.currentPassword && <p className="text-xs text-destructive">{errors.currentPassword.message}</p>}
      </div>

      {/* 新密碼 */}
      <div className="grid gap-1.5">
        <Label htmlFor="ob-newPassword">新密碼</Label>
        <div className="relative">
          <Input
            id="ob-newPassword"
            type={showNew ? 'text' : 'password'}
            placeholder="至少 8 個字元"
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
        {errors.newPassword && <p className="text-xs text-destructive">{errors.newPassword.message}</p>}
      </div>

      {/* 確認新密碼 */}
      <div className="grid gap-1.5">
        <Label htmlFor="ob-confirmPassword">確認新密碼</Label>
        <div className="relative">
          <Input
            id="ob-confirmPassword"
            type={showConfirm ? 'text' : 'password'}
            placeholder="再次輸入新密碼"
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
        {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>}
      </div>

      <Button type="submit" disabled={isPending} className="w-full mt-2">
        {isPending ? '設定中...' : '下一步 →'}
      </Button>
    </form>
  )
}

// ── Step 2：填寫基本資料 ───────────────────────
function Step2Profile({ onSuccess }: { onSuccess: () => void }) {
  const [isPending, startTransition] = useTransition()
  const [realName, setRealName] = useState('')
  const [phone, setPhone] = useState('')
  const [errors, setErrors] = useState<{ realName?: string; phone?: string }>({})

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const errs: typeof errors = {}
    if (!realName.trim()) errs.realName = '請輸入真實姓名'
    if (!phone.trim()) errs.phone = '請輸入手機號碼'
    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({})

    startTransition(async () => {
      const formData = new FormData()
      formData.set('realName', realName.trim())
      formData.set('phone', phone.trim())
      const result = await completeOnboardingProfile(formData)
      if (result.success) {
        onSuccess()
      } else {
        const errMsg =
          result.errors?.realName?.[0] ??
          result.errors?.phone?.[0] ??
          result.message ??
          '儲存失敗'
        toast.error(errMsg)
      }
    })
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      <div className="grid gap-1.5">
        <Label htmlFor="ob-realName">真實姓名</Label>
        <Input
          id="ob-realName"
          placeholder="請輸入您的真實姓名"
          autoComplete="name"
          disabled={isPending}
          value={realName}
          onChange={e => setRealName(e.target.value)}
        />
        {errors.realName && <p className="text-xs text-destructive">{errors.realName}</p>}
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="ob-phone">手機號碼</Label>
        <Input
          id="ob-phone"
          type="tel"
          placeholder="例：0912345678"
          autoComplete="tel"
          disabled={isPending}
          value={phone}
          onChange={e => setPhone(e.target.value)}
        />
        {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
      </div>

      <p className="text-xs text-muted-foreground">其餘資料可於個人資料頁補填。</p>

      <Button type="submit" disabled={isPending} className="w-full mt-2">
        {isPending ? '儲存中...' : '下一步 →'}
      </Button>
    </form>
  )
}

// ── Step 3：歡迎畫面 ──────────────────────────
function Step3Welcome({ spiritId }: { spiritId: string }) {
  const router = useRouter()
  return (
    <div className="grid gap-6 text-center">
      <div className="flex justify-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <IconCheck className="h-8 w-8 text-primary" />
        </div>
      </div>
      <div className="grid gap-2">
        <h2 className="text-xl font-semibold">歡迎加入！</h2>
        <p className="text-sm text-muted-foreground">密碼與基本資料已設定完成。</p>
        {spiritId && (
          <div className="mt-2 rounded-lg bg-muted px-4 py-3">
            <p className="text-xs text-muted-foreground mb-1">您的靈人編號</p>
            <p className="text-2xl font-mono font-bold tracking-widest">{spiritId}</p>
          </div>
        )}
      </div>
      <Button onClick={() => router.push('/dashboard')} className="w-full">
        開始使用 →
      </Button>
    </div>
  )
}

// ── 主 Wizard ─────────────────────────────────
interface OnboardingWizardProps {
  initialStep: number
  initialSpiritId: string
}

export function OnboardingWizard({ initialStep, initialSpiritId }: OnboardingWizardProps) {
  const [step, setStep] = useState(initialStep)
  const [spiritId, setSpiritId] = useState(initialSpiritId)

  const stepTitles = ['設定您的密碼', '填寫基本資料', '歡迎加入！']

  return (
    <div className="relative min-h-screen lg:grid lg:grid-cols-2">

      {/* ── 左側：品牌區（lg 以上才顯示）── */}
      <div className="relative hidden lg:flex flex-col bg-zinc-900 p-10 text-white">
        <div className="flex items-center text-lg font-medium">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            className="mr-2 h-6 w-6">
            <path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3" />
          </svg>
          啟動事工
        </div>
        <div className="mt-auto">
          <blockquote className="space-y-2">
            <p className="text-lg leading-relaxed">
              &ldquo;歡迎加入啟動事工，幾個簡單步驟，開啟您的事工旅程。&rdquo;
            </p>
            <footer className="text-sm text-zinc-400">— 啟動事工</footer>
          </blockquote>
        </div>
      </div>

      {/* ── 右側 / 手機全版：表單區 ── */}
      <div className="flex min-h-screen flex-col lg:min-h-0">
        {/* 手機版 Logo */}
        <div className="flex items-center px-6 pt-6 lg:hidden">
          <div className="flex items-center gap-2 text-base font-semibold">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              className="h-5 w-5">
              <path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3" />
            </svg>
            啟動事工
          </div>
        </div>

        {/* 表單主體 */}
        <div className="flex flex-1 items-center justify-center px-6 py-12">
          <div className="w-full max-w-sm">
            <StepIndicator current={step} total={3} />

            <div className="mb-6">
              <h1 className="text-2xl font-semibold tracking-tight">{stepTitles[step - 1]}</h1>
            </div>

            {step === 1 && (
              <Step1Password
                onSuccess={(id) => {
                  if (id) setSpiritId(id)
                  setStep(2)
                }}
              />
            )}
            {step === 2 && (
              <Step2Profile onSuccess={() => setStep(3)} />
            )}
            {step === 3 && (
              <Step3Welcome spiritId={spiritId} />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
