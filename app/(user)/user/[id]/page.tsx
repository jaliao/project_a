/*
 * ----------------------------------------------
 * 學員專屬頁面
 * 2026-03-24
 * app/(user)/user/[id]/page.tsx
 * ----------------------------------------------
 */

import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { IconUser, IconBook } from '@tabler/icons-react'
import { prisma } from '@/lib/prisma'
import { Badge } from '@/components/ui/badge'
import { COURSE_CATALOG, type CourseLevel } from '@/config/course-catalog'

// learningLevel → 身分標籤
const LEARNING_LEVEL_LABEL: Record<number, string> = {
  1: '啟動靈人 1 學員',
  2: '啟動靈人 2 學員',
  3: '啟動靈人 3 學員',
  4: '啟動靈人 4 學員',
}

type Props = {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const user = await prisma.user.findUnique({
    where: { id },
    select: { realName: true, name: true },
  })
  const displayName = user?.realName || user?.name || '學員'
  return { title: `${displayName} — 啟動靈人系統` }
}

export default async function UserProfilePage({ params }: Props) {
  const { id } = await params

  // 查詢使用者基本資料
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      realName: true,
      name: true,
      learningLevel: true,
      spiritId: true,
    },
  })

  if (!user) notFound()

  // 查詢已完成課程（InviteEnrollment）
  const enrollments = await prisma.inviteEnrollment.findMany({
    where: { userId: id },
    include: {
      invite: {
        select: { courseLevel: true, title: true },
      },
    },
    orderBy: { joinedAt: 'asc' },
  })

  const displayName = user.realName || user.name || '（未設定姓名）'
  const levelLabel = user.learningLevel ? LEARNING_LEVEL_LABEL[user.learningLevel] : null

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">學員資料</h1>

      {/* 基本資料單元 */}
      <div className="rounded-lg border p-5 space-y-4">
        <div className="flex items-center gap-2">
          <IconUser className="h-5 w-5 text-primary" />
          <h2 className="text-base font-semibold">基本資料</h2>
        </div>

        <div className="space-y-3">
          {/* 姓名 */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground w-20 shrink-0">姓名</span>
            <span className="text-sm font-medium">{displayName}</span>
          </div>

          {/* Spirit ID */}
          {user.spiritId && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground w-20 shrink-0">Spirit ID</span>
              <span className="text-sm font-mono">{user.spiritId}</span>
            </div>
          )}

          {/* 身分標籤 */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground w-20 shrink-0">身分標籤</span>
            {levelLabel ? (
              <Badge variant="secondary">{levelLabel}</Badge>
            ) : (
              <span className="text-sm text-muted-foreground">—</span>
            )}
          </div>
        </div>
      </div>

      {/* 已完成課程 */}
      <div className="rounded-lg border p-5 space-y-4">
        <div className="flex items-center gap-2">
          <IconBook className="h-5 w-5 text-primary" />
          <h2 className="text-base font-semibold">已完成課程</h2>
        </div>

        {enrollments.length === 0 ? (
          <p className="text-sm text-muted-foreground">尚未完成任何課程</p>
        ) : (
          <ul className="space-y-2">
            {enrollments.map((enrollment) => {
              const courseLabel = COURSE_CATALOG[enrollment.invite.courseLevel as CourseLevel]?.label
                ?? enrollment.invite.title
              return (
                <li key={enrollment.id} className="flex items-center gap-2 text-sm">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                  {courseLabel}
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
