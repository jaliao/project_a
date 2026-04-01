/*
 * ----------------------------------------------
 * 註冊表單（Client Component）
 * 2026-04-01
 * app/(auth)/register/register-form.tsx
 * ----------------------------------------------
 */

'use client'

import { useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { signIn } from 'next-auth/react'
import { toast } from 'sonner'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { registerSchema } from '@/lib/schemas/auth'
import { registerWithEmail } from '@/app/actions/auth'

type RegisterForm = z.infer<typeof registerSchema>

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

export function RegisterForm() {
  const [isPending, startTransition] = useTransition()

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  })

  const onEmailSubmit = (data: RegisterForm) => {
    startTransition(async () => {
      const formData = new FormData()
      formData.set('email', data.email)
      const result = await registerWithEmail(formData)
      if (result.success) {
        toast.success(result.message ?? '帳號建立成功，請查收 Email')
      } else {
        toast.error(result.errors?.email?.[0] ?? result.message ?? '註冊失敗')
      }
    })
  }

  const handleGoogleSignUp = () => {
    startTransition(async () => {
      await signIn('google', { callbackUrl: '/dashboard' })
    })
  }

  return (
    <div className="grid gap-6">
      {/* Email 表單 */}
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
          {errors.email && (
            <p className="text-xs text-destructive">{errors.email.message}</p>
          )}
        </div>
        <Button disabled={isPending}>
          {isPending ? '建立中...' : '以 Email 建立帳號'}
        </Button>
      </form>

      {/* 分隔線 */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <Separator />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">或繼續使用</span>
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
        以 Google 帳號繼續
      </Button>
    </div>
  )
}
