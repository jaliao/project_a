/*
 * ----------------------------------------------
 * StudyEntryCard - 單筆分段查經筆記檢視卡（可切換編輯，無刪除）
 * 2026-08-28
 * components/learning/study-entry-card.tsx
 *
 * 排版與文字大小比照「聯繫管理者」提問卡片（InquiryCard）；
 * 外框由呼叫端（LessonEntriesPanel 的格子 / 孤兒區塊）提供。
 * ----------------------------------------------
 */

'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { IconPencil } from '@tabler/icons-react'
import type { LearningStudyEntry } from '@prisma/client'
import { Button } from '@/components/ui/button'
import { StudyEntryForm } from './study-entry-form'

function formatTime(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d
  return date.toLocaleString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function Field({ label, value }: { label: string; value: string | null }) {
  if (!value) return null
  // 以 fragment 讓 label／value 直接參與外層 space-y-2 節奏（比照「聯繫管理者」卡片）
  return (
    <>
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className="whitespace-pre-wrap text-sm">{value}</p>
    </>
  )
}

export function StudyEntryCard({ entry }: { entry: LearningStudyEntry }) {
  const t = useTranslations('learning')
  const [isEditing, setEditing] = useState(false)

  const isEdited = new Date(entry.updatedAt).getTime() - new Date(entry.createdAt).getTime() > 1000

  if (isEditing) {
    return (
      <StudyEntryForm
        mode="edit"
        entryId={entry.id}
        initial={{
          mainTitle: entry.mainTitle,
          subTitle: entry.subTitle ?? '',
          wordReceived: entry.wordReceived ?? '',
          application: entry.application ?? '',
        }}
        onDone={() => setEditing(false)}
        onCancel={() => setEditing(false)}
      />
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 space-y-2">
          <Field label={t('fieldMainTitle')} value={entry.mainTitle} />
          <Field label={t('fieldSubTitle')} value={entry.subTitle} />
          <Field label={t('fieldWordReceived')} value={entry.wordReceived} />
          <Field label={t('fieldApplication')} value={entry.application} />
        </div>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="h-7 w-7 shrink-0"
          onClick={() => setEditing(true)}
          aria-label={t('edit')}
        >
          <IconPencil className="h-4 w-4" />
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        {t('filledAtLabel')}：{formatTime(entry.createdAt)}
        {isEdited && (
          <>
            {' · '}
            {t('edited')}（{t('updatedAtLabel')}：{formatTime(entry.updatedAt)}）
          </>
        )}
      </p>
    </div>
  )
}
