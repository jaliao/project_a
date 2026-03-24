/*
 * ----------------------------------------------
 * PendingEnrollmentList - 待審申請清單
 * 2026-03-24
 * app/(user)/course/[id]/pending-enrollment-list.tsx
 * ----------------------------------------------
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { IconUserPlus } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { approveEnrollment } from '@/app/actions/course-invite'

const MATERIAL_LABELS: Record<string, string> = {
  none: '無須購買',
  traditional: '繁體教材',
  simplified: '簡體教材',
}

type Enrollment = {
  id: number
  materialChoice: string
  user: { id: string; name: string | null; email: string | null }
}

type Props = {
  enrollments: Enrollment[]
}

export function PendingEnrollmentList({ enrollments }: Props) {
  const router = useRouter()
  const [loadingId, setLoadingId] = useState<number | null>(null)

  async function handleApprove(enrollmentId: number) {
    setLoadingId(enrollmentId)
    const result = await approveEnrollment(enrollmentId)
    setLoadingId(null)
    if (result.success) {
      toast.success('已同意申請')
      router.refresh()
    } else {
      toast.error(result.message ?? '操作失敗，請稍後再試')
    }
  }

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-5 space-y-4">
      <div className="flex items-center gap-2 text-sm font-medium text-amber-800">
        <IconUserPlus className="h-4 w-4" />
        待審申請（{enrollments.length} 筆）
      </div>
      <ul className="divide-y divide-amber-100">
        {enrollments.map((enrollment) => (
          <li key={enrollment.id} className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm font-medium">
                {enrollment.user.name ?? enrollment.user.email ?? '—'}
              </p>
              {enrollment.user.email && (
                <p className="text-xs text-muted-foreground">{enrollment.user.email}</p>
              )}
              <p className="text-xs text-amber-700 mt-0.5">
                {MATERIAL_LABELS[enrollment.materialChoice] ?? enrollment.materialChoice}
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => handleApprove(enrollment.id)}
              disabled={loadingId === enrollment.id}
            >
              {loadingId === enrollment.id ? '處理中...' : '同意'}
            </Button>
          </li>
        ))}
      </ul>
    </div>
  )
}
