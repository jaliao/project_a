/*
 * ----------------------------------------------
 * 個人資料表單（Client Component）
 * 2026-03-23 (Updated: 2026-09-03)
 * app/(user)/user/[spiritId]/profile/profile-form.tsx
 *
 * cr-spec-260903-001：字串改以 profile i18n 命名空間取用；action toast 以 t() 呈現
 * ----------------------------------------------
 */

'use client'

import { useTransition, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import { signIn } from 'next-auth/react'
import { updateProfile, updateCommEmail, resendCommVerification, unlinkGoogleAccount } from '@/app/actions/profile'
import { updateProfileSchema, commEmailSchema } from '@/lib/schemas/profile'
import { getMemberDisplayName } from '@/lib/utils/member-display'
import { FieldError } from '@/components/ui/field-error'
import { AvatarUploadSection } from '@/components/profile/avatar-upload-section'

type Church = { id: number; name: string; isActive: boolean }

type ProfileFormProps = {
  user: {
    realName: string
    englishName: string
    nickname: string
    phone: string
    address: string
    gender: 'male' | 'female' | 'unspecified'
    birthYear: number | null
    displayNameMode: 'nickname' | 'nickname_zh' | 'nickname_en'
    commEmail: string
    isCommVerified: boolean
    churchType: 'church' | 'other' | 'none'
    churchId: number | null
    churchOther: string
    currentChurch: { id: number; name: string; isActive: boolean } | null
    avatarUrl: string | null
    avatarKey: string | null
  }
  activeChurches: Church[]
  linkedProviders: string[]
  spiritId: string
}

// 表單輸入型別（birthYear 經 zod 轉換，輸入與輸出型別不同）
type ProfileInput = z.input<typeof updateProfileSchema>
type ProfileData = z.output<typeof updateProfileSchema>
type CommEmailData = z.infer<typeof commEmailSchema>

// 選單的 value 格式：'none' | 'other' | 'church:<id>'
function toSelectValue(churchType: string, churchId: number | null): string {
  if (churchType === 'church' && churchId) return `church:${churchId}`
  if (churchType === 'other') return 'other'
  return 'none'
}

export default function ProfileForm({ user, activeChurches, linkedProviders, spiritId }: ProfileFormProps) {
  const t = useTranslations()
  const [isPending, startTransition] = useTransition()
  const [selectValue, setSelectValue] = useState(toSelectValue(user.churchType, user.churchId))

  // 已停用的現有教會需補入選項（讓使用者看到並可更換）
  const churchOptions: Church[] = [
    ...activeChurches,
    ...(user.currentChurch && !user.currentChurch.isActive ? [user.currentChurch] : []),
  ]

  const profileForm = useForm<ProfileInput, unknown, ProfileData>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      realName: user.realName,
      englishName: user.englishName,
      nickname: user.nickname,
      phone: user.phone,
      address: user.address,
      // gender schema 已改為必填 male/female，既有 unspecified 帳號留空由 <select> 預設第一個選項呈現
      gender: user.gender === 'unspecified' ? undefined : user.gender,
      birthYear: user.birthYear,
      displayNameMode: user.displayNameMode,
      churchType: user.churchType,
      churchId: user.churchId ?? undefined,
      churchOther: user.churchOther,
    },
  })

  const commEmailForm = useForm<CommEmailData>({
    resolver: zodResolver(commEmailSchema),
    defaultValues: { commEmail: user.commEmail },
  })

  function handleChurchSelectChange(val: string) {
    setSelectValue(val)
    if (val === 'none') {
      profileForm.setValue('churchType', 'none')
      profileForm.setValue('churchId', undefined)
      profileForm.setValue('churchOther', '')
    } else if (val === 'other') {
      profileForm.setValue('churchType', 'other')
      profileForm.setValue('churchId', undefined)
    } else if (val.startsWith('church:')) {
      const id = parseInt(val.replace('church:', ''), 10)
      profileForm.setValue('churchType', 'church')
      profileForm.setValue('churchId', id)
      profileForm.setValue('churchOther', '')
    }
  }

  const onProfileSubmit = (data: ProfileData) => {
    startTransition(async () => {
      const fd = new FormData()
      fd.set('realName', data.realName)
      fd.set('englishName', data.englishName ?? '')
      fd.set('nickname', data.nickname ?? '')
      fd.set('phone', data.phone ?? '')
      fd.set('address', data.address ?? '')
      fd.set('gender', data.gender)
      fd.set('birthYear', data.birthYear != null ? String(data.birthYear) : '')
      fd.set('displayNameMode', data.displayNameMode)
      fd.set('churchType', data.churchType)
      fd.set('churchId', data.churchId ? String(data.churchId) : '')
      fd.set('churchOther', data.churchOther ?? '')
      const result = await updateProfile(fd)
      result.success
        ? toast.success(result.message ? t(result.message) : t('profile.toast.profileUpdated'))
        : toast.error(result.message ? t(result.message) : t('profile.toast.formHasErrors'))
    })
  }

  const onCommEmailSubmit = (data: CommEmailData) => {
    startTransition(async () => {
      const fd = new FormData()
      fd.set('commEmail', data.commEmail)
      const result = await updateCommEmail(fd)
      result.success
        ? toast.success(result.message ? t(result.message) : t('profile.toast.profileUpdated'))
        : toast.error(result.message ? t(result.message) : t('profile.toast.formHasErrors'))
    })
  }

  const handleResendVerification = () => {
    startTransition(async () => {
      const result = await resendCommVerification()
      result.success
        ? toast.success(result.message ? t(result.message) : t('profile.toast.profileUpdated'))
        : toast.error(result.message ? t(result.message) : t('profile.toast.formHasErrors'))
    })
  }

  const handleLinkGoogle = () => {
    startTransition(async () => {
      await signIn('google', { callbackUrl: `/user/${spiritId.toLowerCase()}/profile` })
    })
  }

  const handleUnlinkGoogle = () => {
    startTransition(async () => {
      const result = await unlinkGoogleAccount()
      result.success
        ? toast.success(result.message ? t(result.message) : t('profile.toast.profileUpdated'))
        : toast.error(result.message ? t(result.message) : t('profile.toast.formHasErrors'))
    })
  }

  const isGoogleLinked = linkedProviders.includes('google')
  const showOtherInput = selectValue === 'other'

  // 顯示名稱即時預覽
  const watchedRealName = profileForm.watch('realName')
  const watchedEnglishName = profileForm.watch('englishName')
  const watchedNickname = profileForm.watch('nickname')
  const watchedDisplayNameMode = profileForm.watch('displayNameMode')
  const displayNamePreview = getMemberDisplayName({
    realName: watchedRealName,
    englishName: watchedEnglishName,
    nickname: watchedNickname,
    displayNameMode: watchedDisplayNameMode,
  })

  return (
    <div className="space-y-8">
      {/* ── 頭像 ── */}
      <section className="rounded-lg border p-6">
        <AvatarUploadSection
          avatarUrl={user.avatarUrl}
          avatarKey={user.avatarKey}
          displayName={getMemberDisplayName(user)}
        />
      </section>

      {/* ── 個人資料 ── */}
      <section className="rounded-lg border p-6 space-y-4">
        <h2 className="text-lg font-semibold">{t('profile.sectionBasic')}</h2>
        <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">{t('profile.fieldRealName')} *</label>
            <input
              {...profileForm.register('realName')}
              className="w-full rounded-md border px-3 py-2"
              disabled={isPending}
            />
            {profileForm.formState.errors.realName && (
              <FieldError message={profileForm.formState.errors.realName.message} className="text-sm text-red-500 mt-1" />
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('profile.fieldEnglishName')}</label>
            <input
              {...profileForm.register('englishName')}
              className="w-full rounded-md border px-3 py-2"
              placeholder={t('profile.placeholderEnglishName')}
              disabled={isPending}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('profile.fieldNickname')}</label>
            <input
              {...profileForm.register('nickname')}
              className="w-full rounded-md border px-3 py-2"
              placeholder={t('profile.placeholderNickname')}
              disabled={isPending}
            />
            {profileForm.formState.errors.nickname && (
              <FieldError message={profileForm.formState.errors.nickname.message} className="text-sm text-red-500 mt-1" />
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">{t('profile.fieldGender')}</label>
              <select
                {...profileForm.register('gender')}
                className="w-full rounded-md border px-3 py-2 text-sm bg-background"
                disabled={isPending}
              >
                <option value="male">{t('profile.genderMale')}</option>
                <option value="female">{t('profile.genderFemale')}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('profile.fieldDisplayNameMode')}</label>
              <select
                {...profileForm.register('displayNameMode')}
                className="w-full rounded-md border px-3 py-2 text-sm bg-background"
                disabled={isPending}
              >
                <option value="nickname">{t('profile.displayModeNickname')}</option>
                <option value="nickname_zh">{t('profile.displayModeNicknameZh')}</option>
                <option value="nickname_en">{t('profile.displayModeNicknameEn')}</option>
              </select>
            </div>
          </div>
          <div className="rounded-md bg-muted px-3 py-2 text-sm">
            <span className="text-muted-foreground">{t('profile.displayNamePreview')}</span>
            <span className="font-medium ml-1">{displayNamePreview}</span>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('profile.fieldBirthYear')}</label>
            <input
              {...profileForm.register('birthYear')}
              type="number"
              inputMode="numeric"
              min={1900}
              max={new Date().getFullYear()}
              placeholder={t('profile.placeholderBirthYear')}
              className="w-full rounded-md border px-3 py-2"
              disabled={isPending}
            />
            {profileForm.formState.errors.birthYear && (
              <FieldError message={profileForm.formState.errors.birthYear.message} className="text-sm text-red-500 mt-1" />
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('profile.fieldPhone')}</label>
            <input
              {...profileForm.register('phone')}
              className="w-full rounded-md border px-3 py-2"
              placeholder={t('profile.placeholderPhone')}
              disabled={isPending}
            />
            {profileForm.formState.errors.phone && (
              <FieldError message={profileForm.formState.errors.phone.message} className="text-sm text-red-500 mt-1" />
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('profile.fieldAddress')}</label>
            <input
              {...profileForm.register('address')}
              className="w-full rounded-md border px-3 py-2"
              disabled={isPending}
            />
          </div>

          {/* 所屬教會/單位 */}
          <div className="space-y-2">
            <label className="block text-sm font-medium">{t('profile.fieldChurch')}</label>
            <select
              className="w-full rounded-md border px-3 py-2 text-sm bg-background"
              value={selectValue}
              onChange={(e) => handleChurchSelectChange(e.target.value)}
              disabled={isPending}
            >
              <option value="none">{t('profile.churchNone')}</option>
              {churchOptions.map((c) => (
                <option key={c.id} value={`church:${c.id}`}>
                  {c.name}{!c.isActive ? t('profile.churchInactiveSuffix') : ''}
                </option>
              ))}
              <option value="other">{t('profile.churchOther')}</option>
            </select>
            {showOtherInput && (
              <input
                {...profileForm.register('churchOther')}
                className="w-full rounded-md border px-3 py-2 text-sm"
                placeholder={t('profile.placeholderChurchOther')}
                disabled={isPending}
              />
            )}
            {profileForm.formState.errors.churchOther && (
              <FieldError message={profileForm.formState.errors.churchOther.message} className="text-sm text-red-500" />
            )}
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="rounded-md bg-primary px-4 py-2 text-white disabled:opacity-50"
          >
            {t('profile.save')}
          </button>
        </form>
      </section>

      {/* ── 通訊 Email ── */}
      <section className="rounded-lg border p-6 space-y-4">
        <h2 className="text-lg font-semibold">{t('profile.sectionCommEmail')}</h2>
        <form onSubmit={commEmailForm.handleSubmit(onCommEmailSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              {t('profile.sectionCommEmail')}
              {user.commEmail && (
                <span className={`ml-2 text-xs px-1.5 py-0.5 rounded ${user.isCommVerified ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                  {user.isCommVerified ? t('profile.commVerified') : t('profile.commUnverified')}
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
              <FieldError message={commEmailForm.formState.errors.commEmail.message} className="text-sm text-red-500 mt-1" />
            )}
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isPending}
              className="rounded-md bg-primary px-4 py-2 text-white disabled:opacity-50"
            >
              {t('profile.updateCommEmail')}
            </button>
            {user.commEmail && !user.isCommVerified && (
              <button
                type="button"
                onClick={handleResendVerification}
                disabled={isPending}
                className="rounded-md border px-4 py-2 disabled:opacity-50"
              >
                {t('profile.resendVerification')}
              </button>
            )}
          </div>
        </form>
      </section>

      {/* ── 帳號連動 ── */}
      <section className="rounded-lg border p-6 space-y-4">
        <h2 className="text-lg font-semibold">{t('profile.sectionAccountLinking')}</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Google</p>
            <p className="text-sm text-muted-foreground">
              {isGoogleLinked ? t('profile.providerLinked') : t('profile.providerUnlinked')}
            </p>
          </div>
          {isGoogleLinked ? (
            <button
              onClick={handleUnlinkGoogle}
              disabled={isPending}
              className="rounded-md border px-4 py-2 text-sm disabled:opacity-50"
            >
              {t('profile.unlink')}
            </button>
          ) : (
            <button
              onClick={handleLinkGoogle}
              disabled={isPending}
              className="rounded-md border px-4 py-2 text-sm disabled:opacity-50"
            >
              {t('profile.link')}
            </button>
          )}
        </div>
        <div className="flex items-center justify-between opacity-60">
          <div>
            <p className="font-medium">LINE</p>
            <p className="text-sm text-muted-foreground">{t('profile.providerUnlinked')}</p>
          </div>
          <button disabled className="rounded-md border px-4 py-2 text-sm opacity-50">
            {t('profile.comingSoon')}
          </button>
        </div>
      </section>
    </div>
  )
}
