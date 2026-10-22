/*
 * ----------------------------------------------
 * 合併帳號按鈕＋對話框（Client Component）
 * 2026-10-16
 * components/admin/member-merge-dialog.tsx
 *
 * cr-feat-261016-003：三步驟——①挑選另一帳號（重用 StudentPicker 元件殼，
 * friends 傳空陣列、onSearch 接 searchMembersForMerge，比照
 * member-course-invite-transfer.tsx 的做法；若呼叫端已知雙方則略過）
 * →②確認主/副帳號方向（依 isUndeliverableEmail 給預設建議，無建議時強制手動指定）
 * →③預覽並解決 unique 衝突、調整 roles/learningLevel、送出合併。
 * ----------------------------------------------
 */

'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import type { UserRole } from '@prisma/client'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { StudentPicker, type StudentPickerSelection } from '@/components/shared/student-picker'
import { ROLE_LABELS } from '@/lib/auth-roles'
import {
  searchMembersForMerge,
  suggestMergeDirection,
  previewMemberMerge,
  mergeMembers,
  type MergePreview,
} from '@/app/actions/member-merge'

type AccountRef = { id: string; displayName: string; spiritId: string | null; email: string | null }

type Props = {
  anchorAccount: AccountRef
  /** 從疑似重複帳號清單開啟時已知雙方，略過搜尋步驟 */
  initialOtherAccount?: AccountRef | null
  /** 觸發按鈕文字，預設「合併帳號」（會員詳情頁）；疑似重複帳號清單可傳「合併這兩筆帳號」 */
  triggerLabel?: string
}

const ALL_ROLES = Object.keys(ROLE_LABELS) as UserRole[]

export function MemberMergeDialog({ anchorAccount, initialOtherAccount, triggerLabel = '合併帳號' }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const [otherAccount, setOtherAccount] = useState<AccountRef | null>(initialOtherAccount ?? null)
  const [secondaryId, setSecondaryId] = useState<string | null>(null)
  const [directionLoaded, setDirectionLoaded] = useState(false)

  const [preview, setPreview] = useState<MergePreview | null>(null)
  const [certResolutions, setCertResolutions] = useState<Record<number, 'primary' | 'secondary'>>({})
  const [intentResolution, setIntentResolution] = useState<'primary' | 'secondary' | null>(null)
  const [enrollResolutions, setEnrollResolutions] = useState<Record<number, 'primary' | 'secondary'>>({})
  const [roles, setRoles] = useState<UserRole[]>([])
  const [learningLevel, setLearningLevel] = useState(0)
  const [notify, setNotify] = useState(false)

  function resetState() {
    setOtherAccount(initialOtherAccount ?? null)
    setSecondaryId(null)
    setDirectionLoaded(false)
    setPreview(null)
    setCertResolutions({})
    setIntentResolution(null)
    setEnrollResolutions({})
    setRoles([])
    setLearningLevel(0)
    setNotify(false)
  }

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (!next) resetState()
  }

  async function handleSearch(query: string) {
    const res = await searchMembersForMerge(query, [anchorAccount.id])
    return {
      success: res.success,
      message: res.message,
      data: res.data ? { candidates: res.data.candidates.map((c) => ({ ...c, isFriend: false })) } : undefined,
    }
  }

  function handlePickOther(s: StudentPickerSelection) {
    setOtherAccount({ id: s.userId, displayName: s.displayName, spiritId: s.spiritId, email: '' })
  }

  // 一旦雙方帳號都確定，載入主/副帳號方向建議（僅載入一次，直到對話框重置）
  useEffect(() => {
    if (!open || !otherAccount || directionLoaded) return
    setDirectionLoaded(true)
    startTransition(async () => {
      const res = await suggestMergeDirection(anchorAccount.id, otherAccount.id)
      if (res.success) {
        setSecondaryId(res.data?.suggestedSecondaryId ?? null)
      } else {
        toast.error(res.message ?? '無法判斷主/副帳號方向')
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, otherAccount, directionLoaded])

  function handleLoadPreview() {
    if (!otherAccount || !secondaryId) return
    const primaryId = secondaryId === anchorAccount.id ? otherAccount.id : anchorAccount.id
    startTransition(async () => {
      const res = await previewMemberMerge(primaryId, secondaryId)
      if (res.success && res.data) {
        setPreview(res.data)
        setRoles(res.data.rolesUnion)
        setLearningLevel(res.data.learningLevelMax)
      } else {
        toast.error(res.message ?? '預覽失敗')
      }
    })
  }

  const allConflictsResolved =
    preview !== null &&
    preview.certificateConflicts.every((c) => certResolutions[c.courseCatalogId]) &&
    preview.enrollmentConflicts.every((c) => enrollResolutions[c.inviteId]) &&
    (!preview.learningIntentConflict || intentResolution !== null)

  function toggleRole(role: UserRole) {
    setRoles((prev) => (prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]))
  }

  function handleConfirm() {
    if (!preview || !allConflictsResolved) return
    startTransition(async () => {
      const result = await mergeMembers({
        primaryId: preview.primary.id,
        secondaryId: preview.secondary.id,
        certificateResolutions: certResolutions,
        learningIntentResolution: intentResolution,
        enrollmentResolutions: enrollResolutions,
        roles,
        learningLevel,
        notify,
      })
      if (result.success) {
        toast.success(result.message ?? '合併成功')
        handleOpenChange(false)
        router.refresh()
      } else {
        toast.error(result.message ?? '合併失敗，請稍後再試')
      }
    })
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        {triggerLabel}
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>合併帳號</DialogTitle>
            <DialogDescription>
              將副帳號的關聯資料改指向主帳號，副帳號標記為已合併並永久無法登入（不刪除資料）。
            </DialogDescription>
          </DialogHeader>

          {!otherAccount && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                目前帳號：{anchorAccount.displayName}（{anchorAccount.spiritId ?? '—'}）
              </p>
              <Button variant="outline" size="sm" onClick={() => setPickerOpen(true)}>
                選擇另一帳號
              </Button>
            </div>
          )}

          {otherAccount && !preview && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">選擇主帳號（保留、可登入）與副帳號（將被標記合併、無法登入）：</p>
              <RadioGroup
                value={secondaryId ?? undefined}
                onValueChange={(v) => setSecondaryId(v)}
                className="space-y-2"
              >
                {[anchorAccount, otherAccount].map((acc) => (
                  <label key={acc.id} className="flex items-center gap-3 rounded-md border p-3 text-sm">
                    <RadioGroupItem value={acc.id} id={`secondary-${acc.id}`} />
                    <span className="flex-1">
                      {acc.displayName}（{acc.spiritId ?? '—'}）
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {secondaryId === acc.id ? '副帳號（將無法登入）' : '主帳號（保留）'}
                    </span>
                  </label>
                ))}
              </RadioGroup>
              <Button size="sm" onClick={handleLoadPreview} disabled={!secondaryId || isPending}>
                {isPending ? '載入中…' : '預覽合併內容'}
              </Button>
            </div>
          )}

          {preview && (
            <div className="max-h-[60vh] space-y-5 overflow-y-auto pr-1 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-md border p-3">
                  <div className="text-xs text-muted-foreground">主帳號（保留，可登入）</div>
                  <div className="font-medium">{preview.primary.displayName}</div>
                  <div className="text-xs text-muted-foreground">{preview.primary.spiritId ?? '—'}</div>
                </div>
                <div className="rounded-md border p-3">
                  <div className="text-xs text-muted-foreground">副帳號（將標記合併，無法登入）</div>
                  <div className="font-medium">{preview.secondary.displayName}</div>
                  <div className="text-xs text-muted-foreground">{preview.secondary.spiritId ?? '—'}</div>
                </div>
              </div>

              <div className="rounded-md border p-3">
                <div className="mb-2 font-medium">副帳號關聯資料筆數</div>
                <div className="grid grid-cols-2 gap-1 text-xs text-muted-foreground">
                  <span>課程報名：{preview.counts.enrollments}</span>
                  <span>結業證書：{preview.counts.certificates}</span>
                  <span>好友關係：{preview.counts.friendships}</span>
                  <span>對話參與：{preview.counts.conversationParticipants}</span>
                  <span>授課班級：{preview.counts.courseInvites}</span>
                  <span>學習歷程回饋：{preview.counts.learningFeedbacks}</span>
                  <span>學習筆記：{preview.counts.learningStudyEntries}</span>
                  <span>聯繫管理者提問：{preview.counts.supportInquiries}</span>
                  <span>通知：{preview.counts.notifications}</span>
                  <span>推播訂閱：{preview.counts.pushSubscriptions}</span>
                </div>
              </div>

              {preview.certificateConflicts.map((c) => (
                <div key={c.courseCatalogId} className="rounded-md border p-3">
                  <div className="mb-2 font-medium">結業證書衝突：{c.courseCatalogLabel}</div>
                  <RadioGroup
                    value={certResolutions[c.courseCatalogId]}
                    onValueChange={(v) =>
                      setCertResolutions((prev) => ({ ...prev, [c.courseCatalogId]: v as 'primary' | 'secondary' }))
                    }
                    className="space-y-1"
                  >
                    <label className="flex items-center gap-2">
                      <RadioGroupItem value="primary" />
                      <span>保留主帳號（{c.primary.producedAt ? '已製作' : '未製作'}{c.primary.note ? `，備註：${c.primary.note}` : ''}）</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <RadioGroupItem value="secondary" />
                      <span>保留副帳號（{c.secondary.producedAt ? '已製作' : '未製作'}{c.secondary.note ? `，備註：${c.secondary.note}` : ''}）</span>
                    </label>
                  </RadioGroup>
                </div>
              ))}

              {preview.enrollmentConflicts.map((c) => (
                <div key={c.inviteId} className="rounded-md border p-3">
                  <div className="mb-2 font-medium">同班級報名衝突：{c.inviteTitle}</div>
                  <RadioGroup
                    value={enrollResolutions[c.inviteId]}
                    onValueChange={(v) =>
                      setEnrollResolutions((prev) => ({ ...prev, [c.inviteId]: v as 'primary' | 'secondary' }))
                    }
                    className="space-y-1"
                  >
                    <label className="flex items-center gap-2">
                      <RadioGroupItem value="primary" />
                      <span>保留主帳號（{c.primary.status}{c.primary.graduatedAt ? '，已結業' : ''}）</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <RadioGroupItem value="secondary" />
                      <span>保留副帳號（{c.secondary.status}{c.secondary.graduatedAt ? '，已結業' : ''}）</span>
                    </label>
                  </RadioGroup>
                </div>
              ))}

              {preview.learningIntentConflict && (
                <div className="rounded-md border p-3">
                  <div className="mb-2 font-medium">上課意願刊登衝突</div>
                  <RadioGroup
                    value={intentResolution ?? undefined}
                    onValueChange={(v) => setIntentResolution(v as 'primary' | 'secondary')}
                    className="space-y-1"
                  >
                    <label className="flex items-center gap-2">
                      <RadioGroupItem value="primary" />
                      <span>保留主帳號的刊登</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <RadioGroupItem value="secondary" />
                      <span>保留副帳號的刊登</span>
                    </label>
                  </RadioGroup>
                </div>
              )}

              <div className="rounded-md border p-3">
                <div className="mb-2 font-medium">身分（合併結果，可調整）</div>
                <div className="flex flex-wrap gap-3">
                  {ALL_ROLES.map((role) => (
                    <label key={role} className="flex items-center gap-1.5 text-xs">
                      <Checkbox checked={roles.includes(role)} onCheckedChange={() => toggleRole(role)} />
                      {ROLE_LABELS[role]}
                    </label>
                  ))}
                </div>
              </div>

              <div className="rounded-md border p-3">
                <Label htmlFor="learning-level" className="mb-2 block font-medium">
                  學習等級（合併結果，可調整）
                </Label>
                <Input
                  id="learning-level"
                  type="number"
                  min={0}
                  max={4}
                  value={learningLevel}
                  onChange={(e) => setLearningLevel(Number(e.target.value))}
                  className="w-24"
                />
              </div>

              {preview.profileFillIns.length > 0 && (
                <div className="rounded-md border p-3">
                  <div className="mb-2 font-medium">主帳號將補上以下欄位（副帳號有值、主帳號原為空）</div>
                  <ul className="list-inside list-disc text-xs text-muted-foreground">
                    {preview.profileFillIns.map((f) => (
                      <li key={f.field}>
                        {f.label}：{f.value}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {!preview.secondary.isUndeliverableEmail && !preview.secondary.isProxyMember && (
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox checked={notify} onCheckedChange={(v) => setNotify(v === true)} />
                  通知副帳號使用者改用新帳號登入
                </label>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => handleOpenChange(false)}>
              取消
            </Button>
            {preview && (
              <Button onClick={handleConfirm} disabled={isPending || !allConflictsResolved}>
                {isPending ? '處理中…' : '確認合併'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <StudentPicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        friends={[]}
        onSearch={handleSearch}
        excludeUserIds={[anchorAccount.id]}
        onSelect={handlePickOther}
        title="選擇另一帳號"
        description="輸入啟動編號、姓名、暱稱或 Email 搜尋要合併的另一筆帳號"
      />
    </>
  )
}
