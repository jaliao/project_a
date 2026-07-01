/*
 * ----------------------------------------------
 * CourseSessionDialog - 新增授課精靈入口 Dialog
 * 2026-03-23 (Updated: 2026-03-30)
 * components/course-session/course-session-dialog.tsx
 * ----------------------------------------------
 */

'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { CreateCourseWizard } from './create-course-wizard/create-course-wizard'
import type { CourseCatalogEntry } from '@/lib/data/course-catalog'
import { IconPlus } from '@tabler/icons-react'

interface CourseSessionDialogProps {
  instructorName?: string
  activeCourses?: CourseCatalogEntry[]
  // 使用者可開設的課程 id 陣列（由書籍講師身分推導，Server Component 傳入）
  teachableCatalogIds?: number[]
  isAdmin?: boolean
  classMaxCapacity?: number
}

export function CourseSessionDialog({
  instructorName = '',
  activeCourses = [],
  teachableCatalogIds = [],
  isAdmin = false,
  classMaxCapacity = 7,
}: CourseSessionDialogProps) {
  const t = useTranslations('course.sessionDialog')
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <IconPlus className="mr-2 h-4 w-4" />
          {t('newCourse')}
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('newCourse')}</DialogTitle>
        </DialogHeader>
        <CreateCourseWizard
          instructorName={instructorName}
          activeCourses={activeCourses}
          teachableCatalogIds={teachableCatalogIds}
          isAdmin={isAdmin}
          classMaxCapacity={classMaxCapacity}
          onClose={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  )
}
