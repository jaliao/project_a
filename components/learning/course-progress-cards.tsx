/*
 * ----------------------------------------------
 * CourseProgressCards - 學習進度三卡（基本資料區塊內）
 * 2026-07-03 (Updated: 2026-08-29)
 * components/learning/course-progress-cards.tsx
 * ----------------------------------------------
 */

import Link from 'next/link'
import {
  IconCircleCheck,
  IconCircleDashed,
  IconCircleDotted,
  IconChevronRight,
} from '@tabler/icons-react'
import type { CourseCatalogEntry } from '@/lib/data/course-catalog'
import type { CompletionCertificate } from '@/lib/data/course-sessions'

interface CourseProgressCardsProps {
  allCourses: CourseCatalogEntry[]
  certificates: CompletionCertificate[]
  /** 已解鎖（approved＋已開課）但尚未結業的課程目錄 id */
  inProgressCatalogIds: number[]
  /** 各「有大綱」目錄的分段查經作業完成度（口徑同「我的學習」） */
  progressByCatalog: Record<number, { done: number; total: number }>
  spiritId: string
  isOwnPage: boolean
}

/**
 * 依課程目錄順序固定顯示各課程進度卡（啟動靈人／啟動豐盛／啟動得勝），三態：
 * - 已完成：有結業紀錄 → 完成樣式＋學業完成時間＋班名/老師
 * - 進行中：已解鎖未結業 → 進行中樣式
 * - 未完成：其餘 → 虛線/灰階
 * 已完成／進行中且該目錄有大綱時，顯示「已完成 X / 共 Y 課」作業完成度（公開）。
 * 本人視角下，已完成／進行中且有大綱的卡片可點進 /user/{spiritId}/learning/{catalogId}。
 */
export function CourseProgressCards({
  allCourses,
  certificates,
  inProgressCatalogIds,
  progressByCatalog,
  spiritId,
  isOwnPage,
}: CourseProgressCardsProps) {
  const certByCatalogId = new Map(certificates.map((c) => [c.courseCatalogId, c]))

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {allCourses.map((course) => {
        const cert = certByCatalogId.get(course.id)
        const isInProgress = inProgressCatalogIds.includes(course.id)
        const progress = progressByCatalog[course.id]
        const linkable = isOwnPage && (!!cert || isInProgress) && progress != null

        const g = cert?.graduatedAt
        const dateStr = g
          ? `${g.getFullYear()}/${String(g.getMonth() + 1).padStart(2, '0')}/${String(g.getDate()).padStart(2, '0')}`
          : null

        const containerClass = `rounded-md border px-3 py-2.5 text-sm space-y-1 ${
          cert
            ? 'border-primary/30 bg-primary/5'
            : isInProgress
              ? 'border-blue-500/40'
              : 'border-dashed text-muted-foreground'
        }${linkable ? ' transition-colors hover:bg-muted/40' : ''}`

        const inner = (
          <>
            <div
              className={`flex items-center gap-2 font-medium ${
                cert ? 'text-primary' : isInProgress ? 'text-blue-600' : ''
              }`}
            >
              {cert ? (
                <IconCircleCheck className="h-4 w-4 shrink-0" />
              ) : isInProgress ? (
                <IconCircleDotted className="h-4 w-4 shrink-0" />
              ) : (
                <IconCircleDashed className="h-4 w-4 shrink-0" />
              )}
              <span>{course.label}</span>
              {linkable && (
                <IconChevronRight className="ml-auto h-4 w-4 shrink-0 text-muted-foreground" />
              )}
            </div>

            <div className="pl-6 space-y-0.5">
              {cert ? (
                <>
                  <p className="text-xs text-foreground">學業完成：{dateStr}</p>
                  <p className="text-xs text-muted-foreground">
                    {cert.title} · {cert.teacherName}
                  </p>
                </>
              ) : isInProgress ? (
                <p className="text-xs">進行中</p>
              ) : (
                <p className="text-xs">未完成</p>
              )}
              {progress != null && (cert || isInProgress) && (
                <p className="text-xs text-muted-foreground">
                  已完成 {progress.done} / 共 {progress.total} 課
                </p>
              )}
            </div>
          </>
        )

        return linkable ? (
          <Link
            key={course.id}
            href={`/user/${spiritId}/learning/${course.id}`}
            className={containerClass}
          >
            {inner}
          </Link>
        ) : (
          <div key={course.id} className={containerClass}>
            {inner}
          </div>
        )
      })}
    </div>
  )
}
