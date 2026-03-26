/*
 * ----------------------------------------------
 * CourseSessionDialog - 新增授課 Dialog
 * 2026-03-23 (Updated: 2026-03-26)
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
import { CourseSessionForm } from './course-session-form'
import { IconPlus } from '@tabler/icons-react'

interface CourseSessionDialogProps {
  instructorName?: string
}

export function CourseSessionDialog({ instructorName = '' }: CourseSessionDialogProps) {
  const [open, setOpen] = useState(false)

  const handleSuccess = (_inviteId: number) => {
    setOpen(false)
  }

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
        <CourseSessionForm instructorName={instructorName} onSuccess={handleSuccess} />
      </DialogContent>
    </Dialog>
  )
}
