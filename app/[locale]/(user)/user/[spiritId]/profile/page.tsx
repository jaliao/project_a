/*
 * ----------------------------------------------
 * 個人資料頁面
 * 2026-03-23 (Updated: 2026-07-08)
 * app/(user)/user/[spiritId]/profile/page.tsx
 * ----------------------------------------------
 */

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { LanguageSwitcher } from '@/components/i18n/language-switcher'
import ProfileForm from './profile-form'
import { ChangePasswordCard } from './change-password-card'
import { ChangeAccountCard } from './change-account-card'
import { SignOutSection } from '@/components/profile/sign-out-section'
import { getActiveChurches } from '@/lib/data/churches'
import { resolveAvatarUrl } from '@/lib/utils/avatar'

type Props = {
  searchParams: Promise<{ incomplete?: string }>
}

export default async function ProfilePage({ searchParams }: Props) {
  const { incomplete } = await searchParams
  const isIncomplete = incomplete === '1'

  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const t = await getTranslations()

  const [user, activeChurches] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        accounts: { select: { provider: true } },
        church: { select: { id: true, name: true, isActive: true } },
      },
    }),
    getActiveChurches(),
  ])

  if (!user) redirect('/login')

  const linkedProviders = user.accounts.map((a) => a.provider)
  const hasPassword = user.passwordHash !== null

  return (
    <div className="container mx-auto max-w-2xl py-8 space-y-8">
      <h1 className="text-2xl font-bold">個人資料</h1>

      {/* 強制填寫提示（由 profile completion guard 轉導時顯示） */}
      {isIncomplete && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
          請先填寫必要資料（真實姓名、手機號碼），才能繼續使用系統。
        </div>
      )}

      {/* Spirit ID＋啟動帳號資訊 唯讀顯示 */}
      <div className="rounded-lg border p-4 space-y-3">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">啟動事工編號</p>
          <p className="text-lg font-mono font-semibold">{user.spiritId ?? '—'}</p>
        </div>
        <div className="space-y-1 border-t pt-3">
          <p className="text-sm text-muted-foreground">啟動帳號資訊</p>
          <p className="font-medium break-all">{user.email}</p>
          <p className="text-xs text-muted-foreground">
            登入方式：
            {[hasPassword ? '密碼登入' : null, linkedProviders.includes('google') ? 'Google 登入' : null]
              .filter(Boolean)
              .join('、') || '—'}
          </p>
        </div>
      </div>

      {/* 需要補填提示 */}
      {(!user.realName || !user.phone) && (
        <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 text-sm text-orange-800">
          請完成個人資料填寫，以便後續課程登記與書本寄送。
        </div>
      )}

      <ProfileForm
        user={{
          realName: user.realName ?? '',
          englishName: user.englishName ?? '',
          nickname: user.nickname ?? '',
          phone: user.phone ?? '',
          address: user.address ?? '',
          gender: user.gender,
          birthYear: user.birthYear,
          displayNameMode: user.displayNameMode,
          commEmail: user.commEmail ?? user.email,
          isCommVerified: user.isCommVerified,
          churchType: user.churchType,
          churchId: user.churchId ?? null,
          churchOther: user.churchOther ?? '',
          currentChurch: user.church ?? null,
          avatarUrl: resolveAvatarUrl(user),
          avatarKey: user.avatarKey,
        }}
        activeChurches={activeChurches}
        linkedProviders={linkedProviders}
        spiritId={user.spiritId ?? ''}
      />

      {/* 帳號修改（變更密碼上方；Google-only 顯示說明卡） */}
      <ChangeAccountCard currentEmail={user.email} hasPassword={hasPassword} />

      {hasPassword && <ChangePasswordCard />}

      {/* 語言設定（語言切換器自 Topbar 移入此處） */}
      <div className="rounded-lg border p-4 flex items-center justify-between gap-3">
        <p className="text-sm font-medium">{t('language.settings')}</p>
        <LanguageSwitcher />
      </div>

      <SignOutSection />
    </div>
  )
}
