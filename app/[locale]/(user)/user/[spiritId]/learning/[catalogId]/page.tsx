/*
 * ----------------------------------------------
 * 我的學習 — 單一書籍（課程目錄）的課次卡片牆
 * 2026-08-28
 * app/(user)/user/[spiritId]/learning/[catalogId]/page.tsx
 * [spiritId] 為 Spirit ID 小寫；[catalogId] 為 CourseCatalog.id
 * 僅本人可存取；catalogId 非法或無大綱 → 導回 /learning
 * ----------------------------------------------
 */

import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { IconArrowLeft, IconLock } from '@tabler/icons-react'
import { getTranslations } from 'next-intl/server'
import type { LearningStudyEntry } from '@prisma/client'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getCatalogOutline, getScripture } from '@/config/learning-outline'
import {
  getUnlockedLearningCatalogIds,
  getStudyEntriesForUser,
  getLessonKeysWithEntries,
  outlineSlotKey,
} from '@/lib/data/learning-study'
import { LessonGrid } from '@/components/learning/lesson-grid'
import { StudyEntryCard } from '@/components/learning/study-entry-card'

export const metadata: Metadata = {
  title: '我的學習 — 啟動事工',
}

type Props = {
  params: Promise<{ spiritId: string; catalogId: string }>
}

export default async function LearningCatalogPage({ params }: Props) {
  const { spiritId, catalogId: catalogIdRaw } = await params
  const session = await auth()

  // 僅本人：他人 → 導回本人；未登入 → 導 /login
  if (session?.user?.spiritId?.toLowerCase() !== spiritId) {
    const selfId = session?.user?.spiritId?.toLowerCase()
    redirect(selfId ? `/user/${selfId}/learning/${catalogIdRaw}` : '/login')
  }

  // catalogId 需為正整數且設定檔有大綱
  const catalogId = Number(catalogIdRaw)
  const outline =
    Number.isInteger(catalogId) && catalogId > 0 ? getCatalogOutline(catalogId) : undefined
  if (!outline) redirect(`/user/${spiritId}/learning`)

  const [user, catalog] = await Promise.all([
    prisma.user.findUnique({ where: { spiritId: spiritId.toUpperCase() }, select: { id: true } }),
    prisma.courseCatalog.findUnique({ where: { id: catalogId }, select: { label: true } }),
  ])
  if (!user) redirect('/login')
  if (!catalog) redirect(`/user/${spiritId}/learning`)

  const t = await getTranslations('learning')

  const unlockedIds = await getUnlockedLearningCatalogIds(user.id)
  const unlocked = unlockedIds.includes(catalogId)

  const backLink = (
    <Link
      href={`/user/${spiritId}/learning`}
      className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
    >
      <IconArrowLeft className="h-4 w-4" />
      {t('backToCatalogs')}
    </Link>
  )

  if (!unlocked) {
    return (
      <div className="space-y-6">
        {backLink}
        <h1 className="text-2xl font-semibold">{catalog.label}</h1>
        <div className="flex items-center gap-2 rounded-lg border p-8 text-sm text-muted-foreground">
          <IconLock className="h-4 w-4 shrink-0" />
          {t('catalogLocked')}
        </div>
      </div>
    )
  }

  // 已解鎖：查筆記並分流「大綱內」與「孤兒」
  const [grouped, withEntries] = await Promise.all([
    getStudyEntriesForUser(user.id, catalogId),
    getLessonKeysWithEntries(user.id, catalogId),
  ])

  const entriesBySlot: Record<string, LearningStudyEntry[]> = {}
  const orphanEntries: LearningStudyEntry[] = []
  for (const [slot, list] of grouped) {
    const [lessonKey, scriptureKey] = slot.split('::')
    if (getScripture(catalogId, lessonKey, scriptureKey)) {
      entriesBySlot[outlineSlotKey(lessonKey, scriptureKey)] = list
    } else {
      orphanEntries.push(...list)
    }
  }

  const totalCount = outline.lessons.length
  const doneCount = outline.lessons.filter(
    (l) => l.scriptures.length === 0 || withEntries.has(l.key)
  ).length

  return (
    <div className="space-y-6">
      {backLink}

      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">{catalog.label}</h1>
        <p className="text-sm text-muted-foreground">
          {t('progressCount', { done: doneCount, total: totalCount })}
        </p>
      </div>

      <LessonGrid
        outline={outline}
        entriesBySlot={entriesBySlot}
        lessonKeysWithEntries={[...withEntries]}
      />

      {orphanEntries.length > 0 && (
        <section className="space-y-3 rounded-md bg-muted/30 p-4">
          <h2 className="text-base font-medium">{t('orphanSectionTitle')}</h2>
          <p className="text-xs text-muted-foreground">{t('orphanSectionHint')}</p>
          {orphanEntries.map((entry) => (
            <StudyEntryCard key={entry.id} entry={entry} />
          ))}
        </section>
      )}
    </div>
  )
}
