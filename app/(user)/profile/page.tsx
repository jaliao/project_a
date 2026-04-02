/*
 * ----------------------------------------------
 * 個人資料頁面
 * 2026-03-23
 * app/(user)/profile/page.tsx
 * ----------------------------------------------
 */

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import ProfileForm from './profile-form'
import { SignOutSection } from '@/components/profile/sign-out-section'

export default async function ProfilePage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { accounts: { select: { provider: true } } },
  })

  if (!user) redirect('/login')

  const linkedProviders = user.accounts.map((a) => a.provider)

  return (
    <div className="container mx-auto max-w-2xl py-8 space-y-8">
      <h1 className="text-2xl font-bold">個人資料</h1>

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
          nickname: user.nickname ?? '',
          phone: user.phone ?? '',
          address: user.address ?? '',
          commEmail: user.commEmail ?? user.email,
          isCommVerified: user.isCommVerified,
        }}
        linkedProviders={linkedProviders}
      />

      <SignOutSection />
    </div>
  )
}
