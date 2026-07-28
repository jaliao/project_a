/*
 * ----------------------------------------------
 * ApprovedStudentsSection - 已核准學員區塊（含管理操作）
 * 2026-07-14
 * app/[locale]/(user)/course/[id]/approved-students-section.tsx
 *
 * 一般學員視角與原 server 渲染版完全相同；
 * 管理者／該課講師另見「新增學員」「移除學員」按鈕，
 * 移除模式下各卡顯示移除按鈕＋啟動編號（Email 仍不顯示）。
 * ----------------------------------------------
 */

'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { IconUsers, IconUserMinus } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { AddStudentDialog, RemoveStudentButton } from '@/components/admin/invite-student-cells'

const MATERIAL_COLORS: Record<string, string> = {
  none: 'bg-gray-100 text-gray-600',
  traditional: 'bg-blue-100 text-blue-700',
  simplified: 'bg-green-100 text-green-700',
  english: 'bg-amber-100 text-amber-700',
}

function formatDate(date: Date): string {
  const d = new Date(date)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}/${m}/${day}`
}

export type ApprovedStudentItem = {
  enrollmentId: number
  displayName: string
  spiritId: string | null
  materialChoice: string
  joinedAt: Date
  graduated: boolean
  hasShipmentItems: boolean
}

export function ApprovedStudentsSection({
  inviteId,
  inviteCompleted,
  canManage,
  isAdmin,
  capacity,
  students,
}: {
  inviteId: number
  inviteCompleted: boolean
  canManage: boolean
  isAdmin: boolean
  capacity: number
  students: ApprovedStudentItem[]
}) {
  const t = useTranslations()
  const [removeMode, setRemoveMode] = useState(false)

  return (
    <div className="rounded-lg border p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <IconUsers className="h-5 w-5 text-primary" />
          <h2 className="text-base font-semibold">
            {t('course.detail.approvedCount', { count: students.length })}
          </h2>
        </div>
        {/* 管理操作按鈕（僅管理者／該課講師） */}
        {canManage && (
          <div className="flex items-center gap-2">
            <AddStudentDialog
              inviteId={inviteId}
              inviteCompleted={inviteCompleted}
              autoOpen={false}
              approvedCount={students.length}
              capacity={capacity}
              isAdmin={isAdmin}
              triggerVariant="outline"
              triggerSize="sm"
            />
            <Button
              variant={removeMode ? 'default' : 'outline'}
              size="sm"
              onClick={() => setRemoveMode((v) => !v)}
              disabled={students.length === 0}
            >
              <IconUserMinus className="h-4 w-4" />
              {removeMode ? '完成移除' : '移除學員'}
            </Button>
          </div>
        )}
      </div>

      {students.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('course.detail.noApproved')}</p>
      ) : (
        /* 卡片式排版（手機單欄、寬視窗雙欄）；不顯示學員 Email */
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {students.map((s) => (
            <li key={s.enrollmentId} className="rounded-lg border p-3 space-y-1.5">
              <p className="text-sm font-medium">{s.displayName}</p>
              {/* 移除模式：加顯啟動編號輔助辨識 */}
              {canManage && removeMode && (
                <p className="font-mono text-xs text-muted-foreground">{s.spiritId ?? '—'}</p>
              )}
              <div className="flex items-center justify-between gap-2">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    MATERIAL_COLORS[s.materialChoice] ?? 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {t(`course.material.${s.materialChoice}`)}
                </span>
                <span className="text-xs text-muted-foreground">{formatDate(s.joinedAt)}</span>
              </div>
              {canManage && removeMode && (
                <div className="flex justify-end">
                  <RemoveStudentButton
                    enrollmentId={s.enrollmentId}
                    studentName={s.displayName}
                    graduated={s.graduated}
                    hasShipmentItems={s.hasShipmentItems}
                  />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
