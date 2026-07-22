/*
 * ----------------------------------------------
 * 我的提問頁面
 * 2026-07-22
 * app/(user)/user/[spiritId]/inquiries/page.tsx
 * [spiritId] 為 Spirit ID 小寫（例：pa260001）
 * 僅本人可存取；他人存取 redirect 至本人 /inquiries
 * ----------------------------------------------
 */

import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { IconArrowLeft, IconMessageCircle } from '@tabler/icons-react'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getMyInquiries } from '@/lib/data/support-inquiry'
import { Badge } from '@/components/ui/badge'

export const metadata: Metadata = {
  title: '我的提問 — 啟動事工',
}

type Props = {
  params: Promise<{ spiritId: string }>
}

export default async function MyInquiriesPage({ params }: Props) {
  const { spiritId } = await params
  const session = await auth()

  if (session?.user?.spiritId?.toLowerCase() !== spiritId) {
    const selfId = session?.user?.spiritId?.toLowerCase()
    redirect(selfId ? `/user/${selfId}/inquiries` : '/login')
  }

  const user = await prisma.user.findUnique({
    where: { spiritId: spiritId.toUpperCase() },
    select: { id: true },
  })
  if (!user) redirect('/login')

  const t = await getTranslations('supportInquiry')
  const inquiries = await getMyInquiries(user.id)

  const CATEGORY_LABELS: Record<string, string> = {
    account: t('categoryAccount'),
    course: t('categoryCourse'),
    material: t('categoryMaterial'),
    other: t('categoryOther'),
  }

  return (
    <div className="space-y-6">
      <Link
        href={`/user/${spiritId}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <IconArrowLeft className="h-4 w-4" />
        {t('backToProfile')}
      </Link>

      <div className="flex items-center gap-2">
        <IconMessageCircle className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-semibold">{t('myInquiriesTitle')}</h1>
      </div>

      {inquiries.length === 0 ? (
        <div className="rounded-lg border p-10 text-center text-sm text-muted-foreground">
          {t('noInquiries')}
        </div>
      ) : (
        <ul className="space-y-3">
          {inquiries.map((inq) => (
            <li key={inq.id} className="rounded-lg border p-4 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium">{CATEGORY_LABELS[inq.category]}</span>
                {inq.status === 'replied' ? (
                  <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                    {t('statusReplied')}
                  </Badge>
                ) : (
                  <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">
                    {t('statusPending')}
                  </Badge>
                )}
              </div>
              <p className="text-sm whitespace-pre-wrap">{inq.body}</p>
              <p className="text-xs text-muted-foreground">
                {t('createdAtPrefix')}
                {inq.createdAt.toLocaleString('zh-TW')}
              </p>
              {inq.status === 'replied' && (
                <div className="rounded-md bg-muted/50 px-3 py-2 space-y-1">
                  <p className="text-sm whitespace-pre-wrap">{inq.replyBody}</p>
                  <p className="text-xs text-muted-foreground">
                    {t('repliedByPrefix')}
                    {inq.repliedByName}　·　{t('repliedAtPrefix')}
                    {inq.repliedAt?.toLocaleString('zh-TW')}
                  </p>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
