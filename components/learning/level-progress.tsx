/*
 * ----------------------------------------------
 * LevelProgress - 學習進度視覺元件
 * 2026-03-23 (Updated: 2026-03-30)
 * components/learning/level-progress.tsx
 * ----------------------------------------------
 */

import { IconCircleCheck, IconCircleDashed } from '@tabler/icons-react'
import type { CourseCatalogEntry } from '@/lib/data/course-catalog'

interface LevelProgressProps {
  allCourses: CourseCatalogEntry[]
  graduatedCatalogIds: Set<number>
}

export function LevelProgress({ allCourses, graduatedCatalogIds }: LevelProgressProps) {
  return (
    <div className="rounded-lg border bg-card p-5">
      <p className="text-sm font-medium text-muted-foreground mb-3">學習進度</p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {allCourses.map((course) => {
          const isCompleted = graduatedCatalogIds.has(course.id)
          return (
            <div
              key={course.id}
              className={`flex items-center gap-2 rounded-md border px-3 py-2.5 text-sm ${
                isCompleted
                  ? 'border-primary/30 bg-primary/5 text-primary'
                  : 'border-dashed text-muted-foreground'
              }`}
            >
              {isCompleted ? (
                <IconCircleCheck className="h-4 w-4 shrink-0" />
              ) : (
                <IconCircleDashed className="h-4 w-4 shrink-0" />
              )}
              <span className="font-medium">{course.label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
