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
import { IconFlask } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { createTestCourseSession } from '@/app/actions/test-course-session'

export function TestCourseSessionButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    setLoading(true)
    const result = await createTestCourseSession()
    setLoading(false)
    if (result.success) {
      toast.success(result.message ?? '測試授課已建立')
      router.refresh()
    } else {
      toast.error(result.message ?? '建立失敗，請稍後再試')
    }
  }

  return (
    <Button variant="outline" onClick={handleClick} disabled={loading}>
      <IconFlask className="mr-2 h-4 w-4" />
      {loading ? '建立中…' : '新增測試授課'}
    </Button>
  )
}
