/*
 * ----------------------------------------------
 * CourseOrderDialog - 課程訂購 Dialog
 * 2026-03-23
 * components/course-order/course-order-dialog.tsx
 * ----------------------------------------------
 */

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { CourseOrderForm } from './course-order-form'

interface CourseOrderDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CourseOrderDialog({ open, onOpenChange }: CourseOrderDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>新增課程訂購</DialogTitle>
        </DialogHeader>
        <CourseOrderForm onSuccess={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  )
}
