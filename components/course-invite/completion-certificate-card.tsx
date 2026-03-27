/*
 * ----------------------------------------------
 * CompletionCertificateCard - 結業證明卡片
 * 2026-03-26
 * components/course-invite/completion-certificate-card.tsx
 * ----------------------------------------------
 */

import { IconAward } from '@tabler/icons-react'
import { COURSE_CATALOG, type CourseLevel } from '@/config/course-catalog'

type Props = {
  courseLevel: string
  title: string
  teacherName: string
  graduatedAt: Date
}

function formatDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}/${m}/${d}`
}

export function CompletionCertificateCard({ courseLevel, title, teacherName, graduatedAt }: Props) {
  const catalogEntry = COURSE_CATALOG[courseLevel as CourseLevel]
  const levelLabel = catalogEntry?.label ?? courseLevel

  return (
    <div className="rounded-lg border bg-card p-4 space-y-2">
      <div className="flex items-center gap-2">
        <IconAward className="h-5 w-5 text-amber-500 shrink-0" />
        <span className="text-sm font-semibold">{levelLabel}</span>
      </div>
      <p className="text-sm text-muted-foreground truncate">{title}</p>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>講師：{teacherName}</span>
        <span>{formatDate(graduatedAt)}</span>
      </div>
    </div>
  )
}
