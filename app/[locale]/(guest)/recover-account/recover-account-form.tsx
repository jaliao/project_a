/*
 * ----------------------------------------------
 * RecoverAccountForm - 找回帳號表單（Client Component）
 * 2026-06-29
 * app/(auth)/recover-account/recover-account-form.tsx
 *
 * 四個畫面狀態：name（輸入姓名）→ quiz（選擇題）→ email（確認/修改）→ done（完成）
 * ----------------------------------------------
 */

'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  findRecoverableAccount,
  answerRecoveryQuestion,
  submitRecoveryEmail,
} from '@/app/actions/account-recovery'

type Option = { id: string; name: string }
type Step = 'name' | 'quiz' | 'email' | 'done'

export function RecoverAccountForm() {
  const t = useTranslations()
  const [isPending, startTransition] = useTransition()
  const [step, setStep] = useState<Step>('name')
  const [error, setError] = useState<string | null>(null)

  // 各步驟狀態
  const [realName, setRealName] = useState('')
  const [token, setToken] = useState('')
  const [prompt, setPrompt] = useState('')
  const [options, setOptions] = useState<Option[]>([])
  const [email, setEmail] = useState('')
  const [doneMsg, setDoneMsg] = useState('')

  // Step 1：查詢姓名
  const onSubmitName = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const res = await findRecoverableAccount(realName)
      if (res.success && res.data) {
        setToken(res.data.token)
        setPrompt(res.data.prompt)
        setOptions(res.data.options)
        setStep('quiz')
      } else {
        setError(res.message ?? '查詢失敗')
      }
    })
  }

  // Step 2：作答
  const onAnswer = (choiceId: string) => {
    setError(null)
    startTransition(async () => {
      const res = await answerRecoveryQuestion(token, choiceId)
      if (res.success && res.data) {
        setToken(res.data.token)
        setEmail(res.data.email)
        setStep('email')
      } else if (res.data?.token) {
        // 答錯但仍可重試：更新 token，顯示剩餘次數
        setToken(res.data.token)
        setError(
          res.data.attemptsLeft != null
            ? `${res.message}（剩餘 ${res.data.attemptsLeft} 次）`
            : (res.message ?? '答案不正確')
        )
      } else {
        // 逾時或超過次數：中止
        setError(res.message ?? '驗證失敗')
        setStep('name')
      }
    })
  }

  // Step 3：確認/修改 email
  const onSubmitEmail = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const res = await submitRecoveryEmail(token, email)
      if (res.success) {
        setDoneMsg(res.message ?? '臨時密碼已寄出')
        setStep('done')
      } else {
        setError(res.errors?.email?.[0] ?? res.message ?? '送出失敗')
      }
    })
  }

  // ── 完成畫面 ──
  if (step === 'done') {
    return (
      <div className="space-y-4 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">{t('recover.doneTitle')}</h1>
        <p className="text-sm text-muted-foreground">{doneMsg}</p>
        <p className="text-sm text-muted-foreground">
          {t('recover.doneLoginHint')}
        </p>
        <Link
          href="/login"
          className="block text-sm font-medium underline underline-offset-4 hover:text-primary"
        >
          {t('recover.goLogin')}
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">{t('recover.title')}</h1>
        <p className="text-sm text-muted-foreground">
          {step === 'name' && t('recover.subtitleName')}
          {step === 'quiz' && t('recover.subtitleQuiz')}
          {step === 'email' && t('recover.subtitleEmail')}
        </p>
      </div>

      {error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
      )}

      {/* Step 1：姓名 */}
      {step === 'name' && (
        <form onSubmit={onSubmitName} className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="realName">{t('recover.nameLabel')}</Label>
            <Input
              id="realName"
              placeholder={t('recover.namePlaceholder')}
              disabled={isPending}
              value={realName}
              onChange={(e) => setRealName(e.target.value)}
            />
          </div>
          <Button disabled={isPending}>{isPending ? t('recover.querying') : t('recover.next')}</Button>
        </form>
      )}

      {/* Step 2：選擇題 */}
      {step === 'quiz' && (
        <div className="grid gap-3">
          <p className="text-sm font-medium">{prompt}</p>
          <div className="grid gap-2">
            {options.map((opt) => (
              <Button
                key={opt.id}
                variant="outline"
                disabled={isPending}
                onClick={() => onAnswer(opt.id)}
                className="justify-start"
              >
                {opt.name}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Step 3：email */}
      {step === 'email' && (
        <form onSubmit={onSubmitEmail} className="grid gap-4">
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
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">{t('recover.emailHint')}</p>
          </div>
          <Button disabled={isPending}>{isPending ? t('recover.submitting') : t('recover.submitEmail')}</Button>
        </form>
      )}

      <p className="text-center text-sm text-muted-foreground">
        {t('recover.canLoginQ')}{' '}
        <Link href="/login" className="font-medium underline underline-offset-4 hover:text-primary">
          {t('common.backToLogin')}
        </Link>
      </p>
    </div>
  )
}
