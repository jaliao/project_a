/*
 * ----------------------------------------------
 * 我的學習頁面（分段查經筆記）
 * 2026-08-28
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
import type { LearningStudyEntry } from '@prisma/client'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getCatalogOutline, getOutlineCatalogIds, getScripture } from '@/config/learning-outline'
import {
  getUnlockedLearningCatalogIds,
  getStudyEntriesForUser,
  outlineSlotKey,
} from '@/lib/data/learning-study'
import { LearningOutlineSection } from '@/components/learning/learning-outline-section'

export const metadata: Metadata = {
  title: '我的學習 — 啟動事工',
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

  // 已解鎖且設定檔有大綱的課程目錄
  const outlineIds = getOutlineCatalogIds()
  const unlockedIds = await getUnlockedLearningCatalogIds(user.id)
  const catalogIds = outlineIds.filter((id) => unlockedIds.includes(id))

  const catalogs =
    catalogIds.length > 0
      ? await prisma.courseCatalog.findMany({
          where: { id: { in: catalogIds } },
          select: { id: true, label: true },
          orderBy: { sortOrder: 'asc' },
        })
      : []

  // 每個目錄的筆記，分為「大綱內」與「孤兒」（大綱已調整、找不到對應課次／經文）
  const sections = await Promise.all(
    catalogs.map(async (catalog) => {
      const outline = getCatalogOutline(catalog.id)!
      const grouped = await getStudyEntriesForUser(user.id, catalog.id)

      const entriesBySlot: Record<string, LearningStudyEntry[]> = {}
      const orphanEntries: LearningStudyEntry[] = []

      for (const [slot, list] of grouped) {
        const [lessonKey, scriptureKey] = slot.split('::')
        if (getScripture(catalog.id, lessonKey, scriptureKey)) {
          entriesBySlot[outlineSlotKey(lessonKey, scriptureKey)] = list
        } else {
          orphanEntries.push(...list)
        }
      }

      return { catalog, outline, entriesBySlot, orphanEntries }
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
      <p className="text-sm text-muted-foreground">{t('intro')}</p>

      {sections.length === 0 ? (
        <div className="rounded-lg border p-8 text-center text-sm text-muted-foreground">
          {t('lockedEmpty')}
        </div>
      ) : (
        <div className="space-y-6">
          {sections.map(({ catalog, outline, entriesBySlot, orphanEntries }) => (
            <LearningOutlineSection
              key={catalog.id}
              catalogLabel={catalog.label}
              outline={outline}
              entriesBySlot={entriesBySlot}
              orphanEntries={orphanEntries}
            />
          ))}
        </div>
      )}
    </div>
  )
}
