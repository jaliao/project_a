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
        <h1 className="text-2xl font-semibold tracking-tight">帳號已找回</h1>
        <p className="text-sm text-muted-foreground">{doneMsg}</p>
        <p className="text-sm text-muted-foreground">
          請至登入頁，以您的 Email 與臨時密碼登入。
        </p>
        <Link
          href="/login"
          className="block text-sm font-medium underline underline-offset-4 hover:text-primary"
        >
          前往登入
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">找回帳號</h1>
        <p className="text-sm text-muted-foreground">
          {step === 'name' && '輸入您的中文名字，協助您找回尚未啟用的帳號'}
          {step === 'quiz' && '為確認是您本人，請回答下列問題'}
          {step === 'email' && '確認或修改您的 Email，臨時密碼將寄至此信箱'}
        </p>
      </div>

      {error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
      )}

      {/* Step 1：姓名 */}
      {step === 'name' && (
        <form onSubmit={onSubmitName} className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="realName">中文名字</Label>
            <Input
              id="realName"
              placeholder="請輸入您的中文姓名"
              disabled={isPending}
              value={realName}
              onChange={(e) => setRealName(e.target.value)}
            />
          </div>
          <Button disabled={isPending}>{isPending ? '查詢中...' : '下一步'}</Button>
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
            <p className="text-xs text-muted-foreground">確認無誤可直接送出；如有錯誤請修改。</p>
          </div>
          <Button disabled={isPending}>{isPending ? '送出中...' : '確認並寄送臨時密碼'}</Button>
        </form>
      )}

      <p className="text-center text-sm text-muted-foreground">
        已經能登入了？{' '}
        <Link href="/login" className="font-medium underline underline-offset-4 hover:text-primary">
          返回登入
        </Link>
      </p>
    </div>
  )
}
