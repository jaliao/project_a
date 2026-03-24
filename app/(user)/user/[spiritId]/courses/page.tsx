/*
 * ----------------------------------------------
 * 我的開課頁面
 * 2026-03-24
 * app/(user)/user/[spiritId]/courses/page.tsx
 * [spiritId] 為 Spirit ID 小寫（例：pa260001）
 * 僅本人可存取；他人存取 redirect 至本人 /courses
 * ----------------------------------------------
 */

import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { IconArrowLeft, IconChalkboard } from '@tabler/icons-react'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getMyCourseSessions } from '@/lib/data/course-sessions'
import { CourseSessionCard } from '@/components/course-session/course-session-card'

export const metadata: Metadata = {
  title: '我的開課 — 啟動靈人系統',
}

type Props = {
  params: Promise<{ spiritId: string }>
}

export default async function UserCoursesPage({ params }: Props) {
  const { spiritId } = await params
  const session = await auth()

  // 存取他人頁面 → redirect 至本人 /courses
  if (session?.user?.spiritId?.toLowerCase() !== spiritId) {
    const selfId = session?.user?.spiritId?.toLowerCase()
    redirect(selfId ? `/user/${selfId}/courses` : '/login')
  }

  // 查詢本人的 userId
  const user = await prisma.user.findUnique({
    where: { spiritId: spiritId.toUpperCase() },
    select: { id: true },
  })

  if (!user) redirect('/login')

  const sessions = await getMyCourseSessions(user.id)

  return (
    <div className="space-y-6">
      {/* 返回連結 */}
      <Link
        href={`/user/${spiritId}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <IconArrowLeft className="h-4 w-4" />
        返回學員頁面
      </Link>

      <div className="flex items-center gap-2">
        <IconChalkboard className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-semibold">我的開課</h1>
      </div>

      {/* 開課列表 */}
      {sessions.length === 0 ? (
        <div className="rounded-lg border p-10 text-center text-sm text-muted-foreground">
          尚無開課記錄
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {sessions.map((item) => (
            <CourseSessionCard
              key={item.id}
              title={item.title}
              courseLevel={item.courseLevel}
              courseDate={item.courseDate}
              maxCount={item.maxCount}
              enrolledCount={item.enrolledCount}
              expiredAt={item.expiredAt}
              variant="compact"
              href={`/course/${item.id}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
