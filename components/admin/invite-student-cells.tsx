/*
 * ----------------------------------------------
 * 後台班級學員管理 - 新增/移除學員元件
 * 2026-07-14 (Updated: 2026-07-17)
 * components/admin/invite-student-cells.tsx
 *
 * AddStudentDialog：Email 或啟動編號查找既有會員（確認列）＋補登結業，
 * 僅限既有會員，查無則不可送出。
 * RemoveStudentButton：已結業報名醒目警示確認後移除。
 * ----------------------------------------------
 */

'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { IconUserPlus, IconAlertTriangle } from '@tabler/icons-react'
import {
  addStudentToInvite,
  removeStudentFromInvite,
  lookupMemberByIdentifier,
} from '@/app/actions/invite-students'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
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

type LookupState =
  | { kind: 'idle' }
  | { kind: 'existing'; displayName: string; spiritId: string | null }
  | { kind: 'new' }

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
  triggerVariant = 'default',
  triggerSize = 'default',
}: {
  inviteId: number
  inviteCompleted: boolean
  autoOpen: boolean
  approvedCount: number
  capacity: number
  isAdmin: boolean
  triggerVariant?: 'default' | 'outline'
  triggerSize?: 'default' | 'sm'
}) {
  const atCapacity = !isAdmin && approvedCount >= capacity
  const router = useRouter()
  const [open, setOpen] = useState(autoOpen)
  const [isPending, startTransition] = useTransition()

  const [identifier, setIdentifier] = useState('')
  const [graduated, setGraduated] = useState(false)
  const [graduatedAt, setGraduatedAt] = useState('')
  const [lookup, setLookup] = useState<LookupState>({ kind: 'idle' })
  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const lookupSeq = useRef(0)

  // 輸入後查詢既有會員（確認列）；空白時延後重置避免 effect 內同步 setState
  useEffect(() => {
    const value = identifier.trim()
    const seq = ++lookupSeq.current
    const timer = setTimeout(
      async () => {
        if (!value) {
          setLookup({ kind: 'idle' })
          return
        }
        const res = await lookupMemberByIdentifier(inviteId, value)
        if (seq !== lookupSeq.current) return // 過期查詢結果丟棄
        const member = res.success ? res.data?.member : null
        setLookup(member ? { kind: 'existing', displayName: member.displayName, spiritId: member.spiritId } : { kind: 'new' })
      },
      value ? 400 : 0
    )
    return () => clearTimeout(timer)
  }, [identifier, inviteId])

  const resetForm = () => {
    setIdentifier('')
    setGraduated(false)
    setGraduatedAt('')
    setLookup({ kind: 'idle' })
    setErrors({})
  }

  const handleOpenChange = (next: boolean) => {
    setOpen(next)
    if (!next) resetForm()
  }

  const handleSubmit = () => {
    setErrors({})
    startTransition(async () => {
      const res = await addStudentToInvite({
        inviteId,
        identifier,
        graduated,
        graduatedAt: graduated ? graduatedAt : undefined,
      })
      if (res.success) {
        toast.success(res.message ?? '已新增學員')
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
        新增學員
      </Button>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>新增學員</DialogTitle>
          <DialogDescription>
            以 Email 或啟動編號查找既有會員並加入班級；查無帳號時請先至會員管理新增。
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {atCapacity && (
            <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              已達班級人數上限（{capacity} 人），如需超過請洽管理者
            </p>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="student-identifier">Email 或啟動編號</Label>
            <Input
              id="student-identifier"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="student@example.com 或 PA260001"
            />
            {errors.identifier?.[0] && <p className="text-sm text-destructive">{errors.identifier[0]}</p>}
            {/* 既有會員確認列 */}
            {lookup.kind === 'existing' && (
              <p className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                將加入既有會員：<span className="font-semibold">{lookup.displayName}</span>
                {lookup.spiritId && <span className="font-mono">（{lookup.spiritId}）</span>}
                ，不會變更其帳號資料
              </p>
            )}
            {lookup.kind === 'new' && (
              <p className="rounded-md border bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
                查無此會員，請確認 Email 或啟動編號
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Checkbox
                id="student-graduated"
                checked={graduated}
                onCheckedChange={(v) => setGraduated(v === true)}
              />
              <Label htmlFor="student-graduated">已結業（補登歷史資料）</Label>
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
                  <p className="text-sm text-amber-700">⚠️ 本班級尚未結業，送出後班級將一併標記結業</p>
                )}
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isPending}>
              取消
            </Button>
            <Button onClick={handleSubmit} disabled={isPending || atCapacity || lookup.kind !== 'existing'}>
              {isPending ? '處理中…' : '新增'}
            </Button>
          </div>
        </div>
      </DialogContent>
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
  const [isPending, startTransition] = useTransition()

  const handleRemove = () => {
    startTransition(async () => {
      const res = await removeStudentFromInvite(enrollmentId)
      if (res.success) {
        toast.success(res.message ?? '已移除學員')
        router.refresh()
      } else {
        toast.error(res.message ?? '移除失敗')
      }
    })
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm" className="text-destructive" disabled={isPending}>
          移除
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className={graduated ? 'flex items-center gap-2 text-destructive' : undefined}>
            {graduated && <IconAlertTriangle className="h-5 w-5" />}
            {graduated ? '移除已結業學員？' : '移除學員？'}
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2">
              <p>
                將自本班級移除 <span className="font-semibold">{studentName}</span> 的報名紀錄。
              </p>
              {graduated && (
                <div className="rounded-md border border-destructive/50 bg-destructive/5 px-3 py-2 text-destructive">
                  此報名<strong>已結業</strong>，移除將影響：
                  <ul className="mt-1 list-inside list-disc">
                    <li>證書製作清單（該階層卡片可能消失）</li>
                    <li>師生階層關係</li>
                    <li>後續課程的擋修資格</li>
                  </ul>
                </div>
              )}
              {hasShipmentItems && (
                <p className="text-amber-700">⚠️ 此報名有教材寄送紀錄，系統將拒絕移除，請先至教材管理處理。</p>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>取消</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-white hover:bg-destructive/90"
            onClick={handleRemove}
          >
            確認移除
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
