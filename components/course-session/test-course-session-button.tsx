/*
 * ----------------------------------------------
 * TestCourseSessionButton - 新增測試授課按鈕（僅測試環境）
 * 2026-06-04
 * components/course-session/test-course-session-button.tsx
 * ----------------------------------------------
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import { IconFlask } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { createTestCourseSession } from '@/app/actions/test-course-session'

export function TestCourseSessionButton() {
  const t = useTranslations('course.test')
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    setLoading(true)
    const result = await createTestCourseSession()
    setLoading(false)
    if (result.success) {
      toast.success(result.message ?? t('created'))
      router.refresh()
    } else {
      toast.error(result.message ?? t('failed'))
    }
  }

  return (
    <Button variant="outline" onClick={handleClick} disabled={loading}>
      <IconFlask className="mr-2 h-4 w-4" />
      {loading ? t('creating') : t('add')}
    </Button>
  )
}
