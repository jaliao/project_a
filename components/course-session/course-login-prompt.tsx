/*
 * ----------------------------------------------
 * CourseLoginPrompt - 未登入訪客課程頁登入提示卡片
 * 2026-06-21
 * components/course-session/course-login-prompt.tsx
 * ----------------------------------------------
 */

import Link from 'next/link'
import { IconLock } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'

export function CourseLoginPrompt({ courseId }: { courseId: number }) {
  const loginHref = `/login?callbackUrl=${encodeURIComponent(`/course/${courseId}`)}`

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-lg border bg-card p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <IconLock className="h-6 w-6 text-muted-foreground" />
        </div>
        <h1 className="text-lg font-semibold">無法檢視此課程</h1>
        <p className="mt-2 text-sm text-muted-foreground">請先登入後再檢視課程內容</p>
        <Button asChild className="mt-6 w-full">
          <Link href={loginHref}>前往登入</Link>
        </Button>
      </div>
    </div>
  )
}
