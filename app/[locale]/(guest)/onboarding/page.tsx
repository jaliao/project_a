/*
 * ----------------------------------------------
 * Onboarding 首次登入引導頁
 * 2026-04-07
 * app/onboarding/page.tsx
 *
 * 三步驟 Wizard：設定密碼 → 填寫基本資料 → 歡迎
 * isTempPassword=true 時由 middleware 導向此頁
 * ----------------------------------------------
 */

import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getActiveChurches } from '@/lib/data/churches'
import { OnboardingWizard } from './onboarding-wizard'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'onboarding' })
  return { title: t('metaTitle') }
}

export default async function OnboardingPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  // 已完成 onboarding 的用戶直接放行
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isTempPassword: true, realName: true, phone: true, spiritId: true },
  })

  if (!user) redirect('/login')

  if (!user.isTempPassword && user.realName && user.phone) {
    redirect('/dashboard')
  }

  // 若密碼已設定但資料未填，從 Step 2 開始
  const initialStep = user.isTempPassword ? 1 : 2

  // 所屬教會清單供 Step 2 選擇
  const churches = await getActiveChurches()

  return (
    <OnboardingWizard
      initialStep={initialStep}
      initialSpiritId={user.spiritId ?? ''}
      churches={churches.map((c) => ({ id: c.id, name: c.name }))}
    />
  )
}
