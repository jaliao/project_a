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
import { useTranslations } from 'next-intl'
import { IconUserPlus } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { approveEnrollment } from '@/app/actions/course-invite'
import { getMemberDisplayName, type DisplayNameMode } from '@/lib/utils/member-display'

type Enrollment = {
  id: number
  materialChoice: string
  user: {
    id: string
    name: string | null
    email: string | null
    realName: string | null
    englishName: string | null
    nickname: string | null
    displayNameMode: DisplayNameMode
  }
}

type Props = {
  enrollments: Enrollment[]
}

export function PendingEnrollmentList({ enrollments }: Props) {
  const t = useTranslations()
  const router = useRouter()
  const [loadingId, setLoadingId] = useState<number | null>(null)

  async function handleApprove(enrollmentId: number) {
    setLoadingId(enrollmentId)
    const result = await approveEnrollment(enrollmentId)
    setLoadingId(null)
    if (result.success) {
      toast.success(t('course.pending.approved'))
      router.refresh()
    } else {
      toast.error(result.message ?? t('course.pending.fail'))
    }
  }

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-5 space-y-4">
      <div className="flex items-center gap-2">
        <IconUserPlus className="h-5 w-5 text-amber-700" />
        <h2 className="text-base font-semibold">
          {t('course.pending.title', { count: enrollments.length })}
        </h2>
      </div>
      <ul className="divide-y divide-amber-100">
        {enrollments.map((enrollment) => (
          <li key={enrollment.id} className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm font-medium">
                {getMemberDisplayName(enrollment.user)}
              </p>
              {enrollment.user.email && (
                <p className="text-xs text-muted-foreground">{enrollment.user.email}</p>
              )}
              <p className="text-xs text-amber-700 mt-0.5">
                {t(`course.material.${enrollment.materialChoice}`)}
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => handleApprove(enrollment.id)}
              disabled={loadingId === enrollment.id}
            >
              {loadingId === enrollment.id ? t('course.pending.processing') : t('course.pending.approve')}
            </Button>
          </li>
        ))}
      </ul>
    </div>
  )
}
