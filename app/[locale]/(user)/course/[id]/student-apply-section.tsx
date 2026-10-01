/*
 * ----------------------------------------------
 * StudentApplySection - 學員申請狀態與申請按鈕
 * 2026-03-24
 * app/(user)/course/[id]/student-apply-section.tsx
 * ----------------------------------------------
 */

'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { EnrollmentApplicationDialog } from '@/components/course-session/enrollment-application-dialog'
import { translateCatalogLabel } from '@/lib/utils/catalog-label'

type MyEnrollment = {
  id: number
  status: string
  materialChoice: string
  materialBookName: string | null
} | null

type Props = {
  inviteId: number
  expiredAt: Date | null
  isCancelled: boolean
  isCompleted: boolean
  myEnrollment: MyEnrollment
  courseTitle: string
  courseDate?: string | null
  instructorName: string
  missingPrerequisites: { id: number; label: string }[]
  defaultBookName?: string
  defaultMaterialChoice?: 'none' | 'traditional'
  materialFinalizedAt: Date | null
}

export function StudentApplySection({
  inviteId,
  expiredAt,
  isCancelled,
  isCompleted,
  myEnrollment,
  courseTitle,
  courseDate,
  instructorName,
  missingPrerequisites,
  defaultBookName,
  defaultMaterialChoice,
  materialFinalizedAt,
}: Props) {
  const t = useTranslations('course.apply')
  const tCatalog = useTranslations('catalog')
  const tEnroll = useTranslations('course.material')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)

  // 課程已取消或結業
  if (isCancelled || isCompleted) return null

  // 已有申請記錄
  if (myEnrollment) {
    if (myEnrollment.status === 'approved') {
      const materialChoice = myEnrollment.materialChoice as 'none' | 'traditional' | 'simplified' | 'english'
      const materialLabel = tEnroll(materialChoice)
      const canChangeMaterial = !materialFinalizedAt
      return (
        <div className="rounded-lg border bg-green-50 border-green-200 p-4 text-sm text-green-700 font-medium space-y-2">
          <p>✓ {t('joined')}</p>
          <p className="font-normal text-green-800">
            {t('materialLabel')}
            {materialLabel}
          </p>
          {canChangeMaterial ? (
            <button
              type="button"
              className="text-xs font-normal underline underline-offset-2 text-green-800 hover:text-green-900"
              onClick={() => setEditDialogOpen(true)}
            >
              {t('changeMaterial')}
            </button>
          ) : (
            <p className="text-xs font-normal text-muted-foreground">{t('materialLocked')}</p>
          )}
          {canChangeMaterial && (
            <EnrollmentApplicationDialog
              mode="edit"
              inviteId={inviteId}
              open={editDialogOpen}
              onOpenChange={setEditDialogOpen}
              courseTitle={courseTitle}
              courseDate={courseDate}
              instructorName={instructorName}
              initialMaterialChoice={materialChoice}
              initialBookName={myEnrollment.materialBookName ?? defaultBookName}
            />
          )}
        </div>
      )
    }
    return (
      <div className="rounded-lg border bg-amber-50 border-amber-200 p-4 text-sm text-amber-700 font-medium">
        ⏳ {t('pending')}
      </div>
    )
  }

  // 報名截止
  const isExpired = expiredAt && expiredAt < new Date()
  if (isExpired) {
    return (
      <div className="rounded-lg border p-4 text-sm text-muted-foreground font-medium">
        {t('deadline')}
      </div>
    )
  }

  const hasPrereqBlock = missingPrerequisites.length > 0

  return (
    <div className="space-y-3">
      <Button disabled={hasPrereqBlock} onClick={() => !hasPrereqBlock && setDialogOpen(true)}>
        {t('apply')}
      </Button>

      {/* 先修課程不符資格提醒 */}
      {hasPrereqBlock && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          <p className="font-medium mb-1">{t('prereqHint')}</p>
          <ul className="space-y-0.5">
            {missingPrerequisites.map((p) => (
              <li key={p.id} className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                {translateCatalogLabel(tCatalog, p.label)}
              </li>
            ))}
          </ul>
        </div>
      )}

      {!hasPrereqBlock && (
        <EnrollmentApplicationDialog
          inviteId={inviteId}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          courseTitle={courseTitle}
          courseDate={courseDate}
          instructorName={instructorName}
          defaultBookName={defaultBookName}
          initialMaterialChoice={defaultMaterialChoice}
        />
      )}
    </div>
  )
}
