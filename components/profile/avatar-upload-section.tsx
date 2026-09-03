/*
 * ----------------------------------------------
 * AvatarUploadSection - 個人資料頁頭像管理區塊
 * 2026-08-03 (Updated: 2026-09-03)
 * components/profile/avatar-upload-section.tsx
 *
 * 選檔後立即上傳（無額外送出按鈕）；avatarKey 有值時才顯示「移除頭像」
 * cr-spec-260903-001：字串改以 profile i18n 命名空間取用；action 訊息以 t() 呈現
 * ----------------------------------------------
 */

'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import { UserAvatar } from '@/components/shared/user-avatar'
import { Button } from '@/components/ui/button'
import { uploadAvatar, removeAvatar } from '@/app/actions/avatar'

type AvatarUploadSectionProps = {
  avatarUrl: string | null
  avatarKey: string | null
  displayName: string
}

export function AvatarUploadSection({ avatarUrl, avatarKey, displayName }: AvatarUploadSectionProps) {
  const t = useTranslations()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading(true)
    const fd = new FormData()
    fd.set('file', file)
    const result = await uploadAvatar(fd)
    setLoading(false)
    e.target.value = ''

    if (result.success) {
      toast.success(t(result.message ?? 'profile.toast.avatarUpdated'))
      router.refresh()
    } else {
      toast.error(t(result.message ?? 'profile.toast.avatarUploadFailed'))
    }
  }

  async function handleRemove() {
    setLoading(true)
    const result = await removeAvatar()
    setLoading(false)

    if (result.success) {
      toast.success(t(result.message ?? 'profile.toast.avatarRemoved'))
      router.refresh()
    } else {
      toast.error(t(result.message ?? 'profile.toast.avatarRemoveFailed'))
    }
  }

  return (
    <div className="flex items-center gap-4">
      <UserAvatar avatarUrl={avatarUrl} displayName={displayName} size="lg" className="size-16" />
      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={loading}
            onClick={() => fileInputRef.current?.click()}
          >
            {loading ? t('profile.processing') : t('profile.avatarUpload')}
          </Button>
          {avatarKey && (
            <Button type="button" variant="ghost" size="sm" disabled={loading} onClick={handleRemove}>
              {t('profile.avatarRemove')}
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">{t('profile.avatarHint')}</p>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  )
}
