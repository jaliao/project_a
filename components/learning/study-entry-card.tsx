/*
 * ----------------------------------------------
 * StudyEntryCard - 單筆分段查經筆記顯示（含編輯／刪除）
 * 2026-08-28
 * components/learning/study-entry-card.tsx
 * ----------------------------------------------
 */

'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import { IconPencil, IconTrash } from '@tabler/icons-react'
import type { LearningStudyEntry } from '@prisma/client'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { deleteStudyEntry } from '@/app/actions/learning-study'
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
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="whitespace-pre-wrap text-sm">{value}</p>
    </div>
  )
}

export function StudyEntryCard({ entry }: { entry: LearningStudyEntry }) {
  const t = useTranslations('learning')
  const [isEditing, setEditing] = useState(false)
  const [isPending, startTransition] = useTransition()

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

  const handleDelete = () => {
    startTransition(async () => {
      const res = await deleteStudyEntry(entry.id)
      if (res.success) toast.success(res.message ?? '')
      else toast.error(res.message ?? t('genericError'))
    })
  }

  return (
    <div className="space-y-2 rounded-md border p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold">{entry.mainTitle}</p>
        <div className="flex shrink-0 items-center gap-1">
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            onClick={() => setEditing(true)}
            aria-label={t('edit')}
          >
            <IconPencil className="h-4 w-4" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-destructive"
                aria-label={t('delete')}
                disabled={isPending}
              >
                <IconTrash className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t('deleteConfirmTitle')}</AlertDialogTitle>
                <AlertDialogDescription>{t('deleteConfirmBody')}</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>
                  {t('deleteConfirmAction')}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <Field label={t('fieldSubTitle')} value={entry.subTitle} />
      <Field label={t('fieldWordReceived')} value={entry.wordReceived} />
      <Field label={t('fieldApplication')} value={entry.application} />

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
