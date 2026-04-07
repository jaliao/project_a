/*
 * ----------------------------------------------
 * 個人資料頁面
 * 2026-03-23 (Updated: 2026-04-02)
 * app/(user)/user/[spiritId]/profile/page.tsx
 * ----------------------------------------------
 */

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import ProfileForm from './profile-form'
import { ChangePasswordCard } from './change-password-card'
import { SignOutSection } from '@/components/profile/sign-out-section'
import { getActiveChurches } from '@/lib/data/churches'

type Props = {
  searchParams: Promise<{ incomplete?: string }>
}

export default async function ProfilePage({ searchParams }: Props) {
  const { incomplete } = await searchParams
  const isIncomplete = incomplete === '1'

  const session = await auth()
  if (!session?.user?.id) redirect('/login')

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

      {/* Spirit ID 唯讀顯示 */}
      <div className="rounded-lg border p-4 space-y-1">
        <p className="text-sm text-muted-foreground">啟動事工編號</p>
        <p className="text-lg font-mono font-semibold">{user.spiritId ?? '—'}</p>
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
          displayNameMode: user.displayNameMode,
          commEmail: user.commEmail ?? user.email,
          isCommVerified: user.isCommVerified,
          churchType: user.churchType,
          churchId: user.churchId ?? null,
          churchOther: user.churchOther ?? '',
          currentChurch: user.church ?? null,
        }}
        activeChurches={activeChurches}
        linkedProviders={linkedProviders}
        spiritId={user.spiritId ?? ''}
      />

      {hasPassword && <ChangePasswordCard />}

      <SignOutSection />
    </div>
  )
}
