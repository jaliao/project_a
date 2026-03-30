/*
 * ----------------------------------------------
 * CreateInviteDialog - 建立邀請 Dialog
 * 2026-03-23
 * components/course-invite/create-invite-dialog.tsx
 * ----------------------------------------------
 */

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { CreateInviteForm } from './create-invite-form'

interface ActiveCourse {
  id: number
  label: string
}

interface Order {
  id: number
  buyerNameZh: string
  courseDate: string
}

interface CreateInviteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  activeCourses: ActiveCourse[]
  orders: Order[]
}

export function CreateInviteDialog({ open, onOpenChange, activeCourses, orders }: CreateInviteDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>開課邀請</DialogTitle>
        </DialogHeader>
        <CreateInviteForm
          activeCourses={activeCourses}
          orders={orders}
          onSuccess={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  )
}
