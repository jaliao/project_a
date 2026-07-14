/*
 * ----------------------------------------------
 * 後台班級學員管理 - 新增/移除學員元件
 * 2026-07-14
 * components/admin/invite-student-cells.tsx
 *
 * AddStudentDialog：姓名＋email（既有會員確認列）＋補登結業，
 * 建新帳號成功時一次性顯示臨時密碼。
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
  lookupMemberByEmail,
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
}: {
  inviteId: number
  inviteCompleted: boolean
  autoOpen: boolean
}) {
  const router = useRouter()
  const [open, setOpen] = useState(autoOpen)
  const [isPending, startTransition] = useTransition()

  const [realName, setRealName] = useState('')
  const [email, setEmail] = useState('')
  const [graduated, setGraduated] = useState(false)
  const [graduatedAt, setGraduatedAt] = useState('')
  const [lookup, setLookup] = useState<LookupState>({ kind: 'idle' })
  const [errors, setErrors] = useState<Record<string, string[]>>({})
  // 建新帳號成功後的一次性顯示資訊
  const [created, setCreated] = useState<{ tempPassword: string; spiritId: string } | null>(null)
  const lookupSeq = useRef(0)

  // email 輸入後查詢既有會員（確認列）；格式無效時延後重置避免 effect 內同步 setState
  useEffect(() => {
    const value = email.trim().toLowerCase()
    const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
    const seq = ++lookupSeq.current
    const timer = setTimeout(
      async () => {
        if (!isValid) {
          setLookup({ kind: 'idle' })
          return
        }
        const res = await lookupMemberByEmail(value)
        if (seq !== lookupSeq.current) return // 過期查詢結果丟棄
        const member = res.success ? res.data?.member : null
        setLookup(member ? { kind: 'existing', displayName: member.displayName, spiritId: member.spiritId } : { kind: 'new' })
      },
      isValid ? 400 : 0
    )
    return () => clearTimeout(timer)
  }, [email])

  const resetForm = () => {
    setRealName('')
    setEmail('')
    setGraduated(false)
    setGraduatedAt('')
    setLookup({ kind: 'idle' })
    setErrors({})
    setCreated(null)
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
        realName,
        email,
        graduated,
        graduatedAt: graduated ? graduatedAt : undefined,
      })
      if (res.success) {
        toast.success(res.message ?? '已新增學員')
        router.refresh()
        if (res.data?.tempPassword && res.data?.spiritId) {
          // 建新帳號：留在 dialog 一次性顯示臨時密碼
          setCreated({ tempPassword: res.data.tempPassword, spiritId: res.data.spiritId })
        } else {
          handleOpenChange(false)
        }
      } else {
        if (res.errors) setErrors(res.errors)
        if (res.message) toast.error(res.message)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <Button onClick={() => setOpen(true)}>
        <IconUserPlus className="h-4 w-4" />
        新增學員
      </Button>
      <DialogContent className="sm:max-w-md">
        {created ? (
          <>
            <DialogHeader>
              <DialogTitle>帳號已建立</DialogTitle>
              <DialogDescription>
                臨時密碼僅顯示這一次，請立即轉交學員（系統不寄信）。
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2 rounded-md border bg-muted/50 p-4 text-sm">
              <p>
                啟動編號：<span className="font-mono font-semibold">{created.spiritId}</span>
              </p>
              <p>
                臨時密碼：<span className="font-mono font-semibold">{created.tempPassword}</span>
              </p>
              <p className="text-muted-foreground">學員以 email＋臨時密碼登入後，將被要求變更密碼。</p>
            </div>
            <Button onClick={() => handleOpenChange(false)}>完成</Button>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>新增學員</DialogTitle>
              <DialogDescription>
                以 email 判斷：既有會員直接加入班級；查無帳號則建立新帳號（臨時密碼轉交）。
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="student-name">姓名（真實姓名）</Label>
                <Input
                  id="student-name"
                  value={realName}
                  onChange={(e) => setRealName(e.target.value)}
                  placeholder="王小明"
                />
                {errors.realName?.[0] && <p className="text-sm text-destructive">{errors.realName[0]}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="student-email">Email</Label>
                <Input
                  id="student-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@example.com"
                />
                {errors.email?.[0] && <p className="text-sm text-destructive">{errors.email[0]}</p>}
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
                    查無此 email 帳號，送出後將建立新帳號
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
                <Button onClick={handleSubmit} disabled={isPending}>
                  {isPending ? '處理中…' : '新增'}
                </Button>
              </div>
            </div>
          </>
        )}
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
