/*
 * ----------------------------------------------
 * 分段式查經 — 書籍（課程目錄）選擇頁
 * 2026-08-28 (Updated: 2026-11-16)
 * app/(user)/user/[spiritId]/learning/page.tsx
 * [spiritId] 為 Spirit ID 小寫（例：pa260001）
 * 本人：可寫入視角。他人：依 getViewableLearningCatalogIds 判定，
 * 至少一個課程目錄可見則唯讀顯示（僅列出可見目錄），否則導回本人 /learning。
 * 未登入 → 導 /login（CR-FEAT-261116-001）
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
  getViewableLearningCatalogIds,
  getFilledOutlineSlots,
} from '@/lib/data/learning-study'
import { getMemberDisplayName } from '@/lib/utils/member-display'
import {
  LearningCatalogGrid,
  type LearningCatalogCard,
} from '@/components/learning/learning-catalog-grid'

type Props = {
  params: Promise<{ spiritId: string }>
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'learning' })
  return { title: t('metaTitle') }
}

export default async function LearningPage({ params }: Props) {
  const { spiritId } = await params
  const session = await auth()

  if (!session?.user?.id) redirect('/login')

  const isOwnPage = session.user.spiritId?.toLowerCase() === spiritId

  const user = await prisma.user.findUnique({
    where: { spiritId: spiritId.toUpperCase() },
    select: { id: true, realName: true, englishName: true, nickname: true, displayNameMode: true },
  })
  if (!user) redirect('/login')

  // 非本人：依可見性判斷唯讀顯示或導回本人頁面
  let viewableIds: number[] | null = null
  if (!isOwnPage) {
    viewableIds = await getViewableLearningCatalogIds(session.user.id, user.id)
    if (viewableIds.length === 0) {
      const selfId = session.user.spiritId?.toLowerCase()
      redirect(selfId ? `/user/${selfId}/learning` : '/login')
    }
  }

  const t = await getTranslations('learning')

  const [catalogs, unlockedIds] = await Promise.all([
    prisma.courseCatalog.findMany({
      select: { id: true, label: true },
      orderBy: { sortOrder: 'asc' },
    }),
    getUnlockedLearningCatalogIds(user.id),
  ])

  const visibleCatalogs = viewableIds ? catalogs.filter((c) => viewableIds!.includes(c.id)) : catalogs

  const cards: LearningCatalogCard[] = await Promise.all(
    visibleCatalogs.map(async (c): Promise<LearningCatalogCard> => {
      const outline = getCatalogOutline(c.id)
      const unlocked = unlockedIds.includes(c.id)
      // viewableIds 已保證是 author 已解鎖目錄的子集，他人視角只需另外確認有大綱
      const canEnter = !!outline && (isOwnPage ? unlocked : true)

      if (!outline || !canEnter) {
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

  const authorName = getMemberDisplayName(user)

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
        <h1 className="text-2xl font-semibold">
          {isOwnPage ? t('pageTitle') : t('pageTitleOther', { name: authorName })}
        </h1>
      </div>
      <p className="text-sm text-muted-foreground">
        {isOwnPage ? t('chooseCatalog') : t('chooseCatalogOther', { name: authorName })}
      </p>

      <LearningCatalogGrid spiritId={spiritId} catalogs={cards} />
    </div>
  )
}
