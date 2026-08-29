/*
 * ----------------------------------------------
 * 分段式查經 — 書籍（課程目錄）選擇頁
 * 2026-08-28 (Updated: 2026-08-29)
 * app/(user)/user/[spiritId]/learning/page.tsx
 * [spiritId] 為 Spirit ID 小寫（例：pa260001）
 * 僅本人可存取；他人存取 redirect 至本人 /learning
 * ----------------------------------------------
 */

import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { IconArrowLeft, IconNotebook } from '@tabler/icons-react'
import { getTranslations } from 'next-intl/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getCatalogOutline, isLessonCompleted } from '@/config/learning-outline'
import {
  getUnlockedLearningCatalogIds,
  getFilledOutlineSlots,
} from '@/lib/data/learning-study'
import {
  LearningCatalogGrid,
  type LearningCatalogCard,
} from '@/components/learning/learning-catalog-grid'

export const metadata: Metadata = {
  title: '分段式查經 — 啟動事工',
}

type Props = {
  params: Promise<{ spiritId: string }>
}

export default async function LearningPage({ params }: Props) {
  const { spiritId } = await params
  const session = await auth()

  // 僅本人：他人 → 導回本人；未登入 → 導 /login
  if (session?.user?.spiritId?.toLowerCase() !== spiritId) {
    const selfId = session?.user?.spiritId?.toLowerCase()
    redirect(selfId ? `/user/${selfId}/learning` : '/login')
  }

  const user = await prisma.user.findUnique({
    where: { spiritId: spiritId.toUpperCase() },
    select: { id: true },
  })
  if (!user) redirect('/login')

  const t = await getTranslations('learning')

  const [catalogs, unlockedIds] = await Promise.all([
    prisma.courseCatalog.findMany({
      select: { id: true, label: true },
      orderBy: { sortOrder: 'asc' },
    }),
    getUnlockedLearningCatalogIds(user.id),
  ])

  const cards: LearningCatalogCard[] = await Promise.all(
    catalogs.map(async (c): Promise<LearningCatalogCard> => {
      const outline = getCatalogOutline(c.id)
      const unlocked = unlockedIds.includes(c.id)
      const canEnter = !!outline && unlocked

      if (!canEnter) {
        return {
          id: c.id,
          label: c.label,
          canEnter: false,
          lockReason: outline ? 'locked' : 'comingSoon',
        }
      }

      const filledSlots = await getFilledOutlineSlots(user.id, c.id)
      const totalCount = outline.lessons.length
      const doneCount = outline.lessons.filter((l) => isLessonCompleted(l, filledSlots)).length

      return { id: c.id, label: c.label, canEnter: true, doneCount, totalCount }
    })
  )

  return (
    <div className="space-y-6">
      <Link
        href={`/user/${spiritId}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <IconArrowLeft className="h-4 w-4" />
        {t('backToProfile')}
      </Link>

      <div className="flex items-center gap-2">
        <IconNotebook className="h-5 w-5 text-primary" />
        <h1 className="text-2xl font-semibold">{t('pageTitle')}</h1>
      </div>
      <p className="text-sm text-muted-foreground">{t('chooseCatalog')}</p>

      <LearningCatalogGrid spiritId={spiritId} catalogs={cards} />
    </div>
  )
}
