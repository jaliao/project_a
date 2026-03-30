/*
 * ----------------------------------------------
 * CourseSessionDialog - 新增授課精靈入口 Dialog
 * 2026-03-23 (Updated: 2026-03-30)
 * components/course-session/course-session-dialog.tsx
 * ----------------------------------------------
 */

'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { CreateCourseWizard } from './create-course-wizard/create-course-wizard'
import { IconPlus } from '@tabler/icons-react'

interface CourseSessionDialogProps {
  instructorName?: string
  // 使用者已取得的講師等級數字陣列（由 Server Component 傳入）
  instructorLevels?: number[]
  isAdmin?: boolean
}

export function CourseSessionDialog({
  instructorName = '',
  instructorLevels = [],
  isAdmin = false,
}: CourseSessionDialogProps) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <IconPlus className="mr-2 h-4 w-4" />
          新增授課
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>新增授課</DialogTitle>
        </DialogHeader>
        <CreateCourseWizard
          instructorName={instructorName}
          instructorLevels={instructorLevels}
          isAdmin={isAdmin}
          onClose={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  )
}
