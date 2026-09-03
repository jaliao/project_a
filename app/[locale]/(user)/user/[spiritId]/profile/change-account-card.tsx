/*
 * ----------------------------------------------
 * ChangeAccountCard - 帳號修改卡（登入 Email 變更）
 * 2026-07-14 (Updated: 2026-09-03)
 * app/[locale]/(user)/user/[spiritId]/profile/change-account-card.tsx
 *
 * 有密碼者：新 email＋目前密碼＋確認視窗後立即生效；
 * Google-only（無密碼）：顯示「請洽管理員協助修改」說明卡。
 * cr-spec-260903-001：字串改以 profile i18n 命名空間取用；action 訊息以 t() 呈現
 * ----------------------------------------------
 */

'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import { IconAt } from '@tabler/icons-react'
import { changeMyAccountEmail } from '@/app/actions/profile'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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

export function ChangeAccountCard({
  currentEmail,
  hasPassword,
}: {
  currentEmail: string
  hasPassword: boolean
}) {
  const t = useTranslations()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [newEmail, setNewEmail] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const [confirmOpen, setConfirmOpen] = useState(false)

  // Google-only：不開放自改
  if (!hasPassword) {
    return (
      <div className="rounded-lg border p-4 space-y-2">
        <div className="flex items-center gap-2">
          <IconAt className="h-5 w-5 text-primary" />
          <h2 className="text-base font-semibold">{t('profile.changeAccountTitle')}</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          {t('profile.changeAccountGoogleOnly')}
        </p>
      </div>
    )
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
        {t('profile.changeAccountDesc')}<span className="font-medium">{currentEmail}</span>
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
                  {currentEmail}
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
