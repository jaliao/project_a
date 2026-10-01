/*
 * ----------------------------------------------
 * 後台班級學員管理 - 新增/移除學員元件
 * 2026-07-14 (Updated: 2026-09-16)
 * components/admin/invite-student-cells.tsx
 *
 * AddStudentDialog：透過「學員選擇元件」StudentPicker 單選既有會員（模糊搜尋／
 * 社群好友直接點選）＋補登結業，僅限既有會員。
 * RemoveStudentButton：已結業報名醒目警示確認後移除。
 * cr-spec-260916-004：移除原「輸入 Email 或啟動編號」文字框，改用 StudentPicker。
 * ----------------------------------------------
 */

'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { IconUserPlus, IconAlertTriangle } from '@tabler/icons-react'
import { addStudentToInvite, removeStudentFromInvite, searchStudentsForInvite } from '@/app/actions/invite-students'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import { StudentPicker, type StudentPickerSelection } from '@/components/shared/student-picker'
import type { FriendListItem } from '@/lib/data/friendship'

// ==========================================
// 新增學員 Dialog
// ==========================================
export function AddStudentDialog({
  inviteId,
  inviteCompleted,
  autoOpen,
  approvedCount,
  capacity,
  isAdmin,
  friends,
  excludeUserIds,
  triggerVariant = 'default',
  triggerSize = 'default',
}: {
  inviteId: number
  inviteCompleted: boolean
  autoOpen: boolean
  approvedCount: number
  capacity: number
  isAdmin: boolean
  friends: FriendListItem[]
  excludeUserIds: string[]
  triggerVariant?: 'default' | 'outline'
  triggerSize?: 'default' | 'sm'
}) {
  const atCapacity = !isAdmin && approvedCount >= capacity
  const router = useRouter()
  const t = useTranslations('course.inviteStudent')
  const td = useTranslations('course.detail')
  const [open, setOpen] = useState(autoOpen)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const [selectedStudent, setSelectedStudent] = useState<StudentPickerSelection | null>(null)
  const [graduated, setGraduated] = useState(false)
  const [graduatedAt, setGraduatedAt] = useState('')
  const [errors, setErrors] = useState<Record<string, string[]>>({})

  const resetForm = () => {
    setSelectedStudent(null)
    setGraduated(false)
    setGraduatedAt('')
    setErrors({})
  }

  const handleOpenChange = (next: boolean) => {
    setOpen(next)
    if (!next) resetForm()
  }

  const handleSubmit = () => {
    if (!selectedStudent) return
    setErrors({})
    startTransition(async () => {
      const res = await addStudentToInvite({
        inviteId,
        userId: selectedStudent.userId,
        graduated,
        graduatedAt: graduated ? graduatedAt : undefined,
      })
      if (res.success) {
        toast.success(res.message ?? t('toastAdded'))
        router.refresh()
        handleOpenChange(false)
      } else {
        if (res.errors) setErrors(res.errors)
        if (res.message) toast.error(res.message)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <Button variant={triggerVariant} size={triggerSize} onClick={() => setOpen(true)}>
        <IconUserPlus className="h-4 w-4" />
        {td('addStudentButton')}
      </Button>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('addDialogTitle')}</DialogTitle>
          <DialogDescription>{t('addDialogDesc')}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {atCapacity && (
            <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {t('capacityWarning', { capacity })}
            </p>
          )}
          <div className="space-y-1.5">
            <Label>{t('studentLabel')}</Label>
            {selectedStudent ? (
              <div className="flex items-center justify-between gap-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                <span>
                  <span className="font-semibold">{selectedStudent.displayName}</span>
                  {selectedStudent.spiritId && <span className="font-mono">（{selectedStudent.spiritId}）</span>}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="shrink-0"
                  onClick={() => setSelectedStudent(null)}
                  disabled={isPending}
                >
                  {t('reselect')}
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => setPickerOpen(true)}
                disabled={atCapacity}
              >
                <IconUserPlus className="h-4 w-4" />
                {t('selectStudent')}
              </Button>
            )}
            {errors.userId?.[0] && <p className="text-sm text-destructive">{errors.userId[0]}</p>}
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Checkbox
                id="student-graduated"
                checked={graduated}
                onCheckedChange={(v) => setGraduated(v === true)}
              />
              <Label htmlFor="student-graduated">{t('graduatedCheckbox')}</Label>
            </div>
            {graduated && (
              <div className="space-y-1.5 pl-6">
                <Input
                  type="date"
                  value={graduatedAt}
                  onChange={(e) => setGraduatedAt(e.target.value)}
                  className="w-fit"
                />
                {errors.graduatedAt?.[0] && (
                  <p className="text-sm text-destructive">{errors.graduatedAt[0]}</p>
                )}
                {!inviteCompleted && (
                  <p className="text-sm text-amber-700">{t('graduatedWarning')}</p>
                )}
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isPending}>
              {t('cancel')}
            </Button>
            <Button onClick={handleSubmit} disabled={isPending || atCapacity || !selectedStudent}>
              {isPending ? t('processing') : t('submit')}
            </Button>
          </div>
        </div>
      </DialogContent>
      <StudentPicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        friends={friends}
        onSearch={(query) => searchStudentsForInvite(inviteId, query)}
        onSelect={(student) => setSelectedStudent(student)}
        excludeUserIds={excludeUserIds}
      />
    </Dialog>
  )
}

// ==========================================
// 移除學員按鈕（已結業報名醒目警示）
// ==========================================
export function RemoveStudentButton({
  enrollmentId,
  studentName,
  graduated,
  hasShipmentItems,
}: {
  enrollmentId: number
  studentName: string
  graduated: boolean
  hasShipmentItems: boolean
}) {
  const router = useRouter()
  const t = useTranslations('course.inviteStudent')
  const [isPending, startTransition] = useTransition()
  const [reason, setReason] = useState('')
  const [reasonError, setReasonError] = useState<string | null>(null)

  const handleRemove = () => {
    startTransition(async () => {
      const res = await removeStudentFromInvite(enrollmentId, reason)
      if (res.success) {
        toast.success(res.message ?? t('toastRemoved'))
        setReason('')
        setReasonError(null)
        router.refresh()
      } else if (res.errors?.reason) {
        setReasonError(res.errors.reason[0])
      } else {
        toast.error(res.message ?? t('toastRemoveFail'))
      }
    })
  }

  return (
    <AlertDialog
      onOpenChange={(open) => {
        if (!open) {
          setReason('')
          setReasonError(null)
        }
      }}
    >
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm" className="text-destructive" disabled={isPending}>
          {t('removeTrigger')}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className={graduated ? 'flex items-center gap-2 text-destructive' : undefined}>
            {graduated && <IconAlertTriangle className="h-5 w-5" />}
            {graduated ? t('removeConfirmTitleGraduated') : t('removeConfirmTitle')}
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2">
              <p>
                {t.rich('removeConfirmDescLine', {
                  name: studentName,
                  strong: (chunks) => <span className="font-semibold">{chunks}</span>,
                })}
              </p>
              {graduated && (
                <div className="rounded-md border border-destructive/50 bg-destructive/5 px-3 py-2 text-destructive">
                  {t.rich('removeGraduatedWarningTitle', { strong: (chunks) => <strong>{chunks}</strong> })}
                  <ul className="mt-1 list-inside list-disc">
                    <li>{t('removeGraduatedWarningItem1')}</li>
                    <li>{t('removeGraduatedWarningItem2')}</li>
                    <li>{t('removeGraduatedWarningItem3')}</li>
                  </ul>
                </div>
              )}
              {hasShipmentItems && (
                <p className="text-amber-700">{t('removeShipmentWarning')}</p>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-1.5 px-1">
          <Label htmlFor={`remove-reason-${enrollmentId}`}>{t('removeReasonLabel')}</Label>
          <Textarea
            id={`remove-reason-${enrollmentId}`}
            placeholder={t('removeReasonPlaceholder')}
            value={reason}
            onChange={(e) => {
              setReason(e.target.value)
              if (reasonError) setReasonError(null)
            }}
            rows={3}
          />
          {reasonError && <p className="text-sm text-destructive">{reasonError}</p>}
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-white hover:bg-destructive/90"
            disabled={!reason.trim() || isPending}
            onClick={(e) => {
              e.preventDefault()
              handleRemove()
            }}
          >
            {t('removeConfirmAction')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
