/*
 * ----------------------------------------------
 * Step1CourseCard - 精靈步驟 1：卡片式課程選擇
 * 2026-03-30
 * components/course-session/create-course-wizard/step-1-course-card.tsx
 * ----------------------------------------------
 */

'use client'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import type { CourseCatalogEntry } from '@/lib/data/course-catalog'
import { IconCheck } from '@tabler/icons-react'

interface Step1CourseCardProps {
  courses: CourseCatalogEntry[]
  selected: number | null
  onSelect: (id: number) => void
  onNext: () => void
  // 使用者已結業的課程 id 陣列（由 Server Component 傳入）
  graduatedCatalogIds: number[]
  isAdmin: boolean
}

export function Step1CourseCard({
  courses,
  selected,
  onSelect,
  onNext,
  graduatedCatalogIds,
  isAdmin,
}: Step1CourseCardProps) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">請選擇要開設的課程</p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {courses.map((course) => {
          const isSelected = selected === course.id
          const hasQualification =
            isAdmin || graduatedCatalogIds.includes(course.id)

          return (
            <button
              key={course.id}
              type="button"
              onClick={() => hasQualification && onSelect(course.id)}
              disabled={!hasQualification}
              className={cn(
                'relative rounded-lg border p-4 text-left transition-all',
                hasQualification
                  ? 'hover:border-primary/60 hover:bg-muted/50 cursor-pointer'
                  : 'opacity-50 cursor-not-allowed bg-muted/30',
                isSelected
                  ? 'border-primary ring-2 ring-primary/20 bg-primary/5'
                  : 'border-border'
              )}
            >
              {/* 選中勾勾 */}
              {isSelected && (
                <span className="absolute top-3 right-3 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <IconCheck className="h-3 w-3" />
                </span>
              )}

              <p className="font-semibold text-sm">{course.label}</p>

              {/* 無授課資格提示 */}
              {!hasQualification && (
                <p className="mt-1.5 text-xs text-muted-foreground">
                  須先完成{course.label}才能授課
                </p>
              )}
            </button>
          )
        })}
      </div>

      <Button className="w-full" disabled={!selected} onClick={onNext}>
        下一步
      </Button>
    </div>
  )
}
