/*
 * ----------------------------------------------
 * 個人資料表單（Client Component）
 * 2026-03-23
 * app/(user)/profile/profile-form.tsx
 * ----------------------------------------------
 */

'use client'

import { useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { signIn } from 'next-auth/react'
import { updateProfile, updateCommEmail, resendCommVerification, unlinkGoogleAccount } from '@/app/actions/profile'
import { updateProfileSchema, commEmailSchema } from '@/lib/schemas/profile'

type ProfileFormProps = {
  user: {
    realName: string
    nickname: string
    phone: string
    address: string
    commEmail: string
    isCommVerified: boolean
  }
  linkedProviders: string[]
}

type ProfileData = z.infer<typeof updateProfileSchema>
type CommEmailData = z.infer<typeof commEmailSchema>

export default function ProfileForm({ user, linkedProviders }: ProfileFormProps) {
  const [isPending, startTransition] = useTransition()

  const profileForm = useForm<ProfileData>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: { realName: user.realName, nickname: user.nickname, phone: user.phone, address: user.address },
  })

  const commEmailForm = useForm<CommEmailData>({
    resolver: zodResolver(commEmailSchema),
    defaultValues: { commEmail: user.commEmail },
  })

  const onProfileSubmit = (data: ProfileData) => {
    startTransition(async () => {
      const fd = new FormData()
      fd.set('realName', data.realName)
      fd.set('nickname', data.nickname ?? '')
      fd.set('phone', data.phone ?? '')
      fd.set('address', data.address ?? '')
      const result = await updateProfile(fd)
      result.success ? toast.success(result.message) : toast.error(result.message)
    })
  }

  const onCommEmailSubmit = (data: CommEmailData) => {
    startTransition(async () => {
      const fd = new FormData()
      fd.set('commEmail', data.commEmail)
      const result = await updateCommEmail(fd)
      result.success ? toast.success(result.message) : toast.error(result.message)
    })
  }

  const handleResendVerification = () => {
    startTransition(async () => {
      const result = await resendCommVerification()
      result.success ? toast.success(result.message) : toast.error(result.message)
    })
  }

  const handleLinkGoogle = () => {
    startTransition(async () => {
      await signIn('google', { callbackUrl: '/profile' })
    })
  }

  const handleUnlinkGoogle = () => {
    startTransition(async () => {
      const result = await unlinkGoogleAccount()
      result.success ? toast.success(result.message) : toast.error(result.message)
    })
  }

  const isGoogleLinked = linkedProviders.includes('google')

  return (
    <div className="space-y-8">
      {/* ── 個人資料 ── */}
      <section className="rounded-lg border p-6 space-y-4">
        <h2 className="text-lg font-semibold">基本資料</h2>
        <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">真實姓名 *</label>
            <input
              {...profileForm.register('realName')}
              className="w-full rounded-md border px-3 py-2"
              disabled={isPending}
            />
            {profileForm.formState.errors.realName && (
              <p className="text-sm text-red-500 mt-1">{profileForm.formState.errors.realName.message}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">暱稱</label>
            <input
              {...profileForm.register('nickname')}
              className="w-full rounded-md border px-3 py-2"
              placeholder="最多 20 個字（選填）"
              disabled={isPending}
            />
            {profileForm.formState.errors.nickname && (
              <p className="text-sm text-red-500 mt-1">{profileForm.formState.errors.nickname.message}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">手機號碼</label>
            <input
              {...profileForm.register('phone')}
              className="w-full rounded-md border px-3 py-2"
              placeholder="09xxxxxxxx"
              disabled={isPending}
            />
            {profileForm.formState.errors.phone && (
              <p className="text-sm text-red-500 mt-1">{profileForm.formState.errors.phone.message}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">收件地址</label>
            <input
              {...profileForm.register('address')}
              className="w-full rounded-md border px-3 py-2"
              disabled={isPending}
            />
          </div>
          <button
            type="submit"
            disabled={isPending}
            className="rounded-md bg-primary px-4 py-2 text-white disabled:opacity-50"
          >
            儲存資料
          </button>
        </form>
      </section>

      {/* ── 通訊 Email ── */}
      <section className="rounded-lg border p-6 space-y-4">
        <h2 className="text-lg font-semibold">通訊 Email</h2>
        <form onSubmit={commEmailForm.handleSubmit(onCommEmailSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              通訊 Email
              {user.commEmail && (
                <span className={`ml-2 text-xs px-1.5 py-0.5 rounded ${user.isCommVerified ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                  {user.isCommVerified ? '已驗證' : '未驗證'}
                </span>
              )}
            </label>
            <input
              {...commEmailForm.register('commEmail')}
              type="email"
              className="w-full rounded-md border px-3 py-2"
              disabled={isPending}
            />
            {commEmailForm.formState.errors.commEmail && (
              <p className="text-sm text-red-500 mt-1">{commEmailForm.formState.errors.commEmail.message}</p>
            )}
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isPending}
              className="rounded-md bg-primary px-4 py-2 text-white disabled:opacity-50"
            >
              更新通訊 Email
            </button>
            {user.commEmail && !user.isCommVerified && (
              <button
                type="button"
                onClick={handleResendVerification}
                disabled={isPending}
                className="rounded-md border px-4 py-2 disabled:opacity-50"
              >
                重發驗證信
              </button>
            )}
          </div>
        </form>
      </section>

      {/* ── 帳號連動 ── */}
      <section className="rounded-lg border p-6 space-y-4">
        <h2 className="text-lg font-semibold">帳號連動</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Google</p>
            <p className="text-sm text-muted-foreground">
              {isGoogleLinked ? '已連結' : '未連結'}
            </p>
          </div>
          {isGoogleLinked ? (
            <button
              onClick={handleUnlinkGoogle}
              disabled={isPending}
              className="rounded-md border px-4 py-2 text-sm disabled:opacity-50"
            >
              解除連結
            </button>
          ) : (
            <button
              onClick={handleLinkGoogle}
              disabled={isPending}
              className="rounded-md border px-4 py-2 text-sm disabled:opacity-50"
            >
              連結帳號
            </button>
          )}
        </div>
        <div className="flex items-center justify-between opacity-60">
          <div>
            <p className="font-medium">LINE</p>
            <p className="text-sm text-muted-foreground">未連結</p>
          </div>
          <button disabled className="rounded-md border px-4 py-2 text-sm opacity-50">
            即將推出
          </button>
        </div>
      </section>
    </div>
  )
}
