/*
 * ----------------------------------------------
 * EnrolledStudentsList - 已接受邀請學員清單
 * 2026-03-23
 * components/course-session/enrolled-students-list.tsx
 * ----------------------------------------------
 */

import { prisma } from '@/lib/prisma'
import { format } from 'date-fns'
import { zhTW } from 'date-fns/locale'

// 取得最新邀請的接受學員清單
async function getEnrolledStudents() {
  // 取最新一筆 CourseInvite
  const latestInvite = await prisma.courseInvite.findFirst({
    orderBy: { createdAt: 'desc' },
    include: {
      enrollments: {
        orderBy: { joinedAt: 'desc' },
        include: {
          user: {
            select: { realName: true, nickname: true, name: true },
          },
        },
      },
    },
  })

  return latestInvite?.enrollments ?? []
}

// 組合學員顯示名稱（realName | nickname）
function formatStudentName(user: {
  realName: string | null
  nickname: string | null
  name: string | null
}): string {
  const displayName = user.realName || user.name || '（未設定姓名）'
  const nickname = user.nickname || '—'
  return `${displayName} | ${nickname}`
}

export async function EnrolledStudentsList() {
  const enrollments = await getEnrolledStudents()

  if (enrollments.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-2">尚無學員接受邀請</p>
    )
  }

  return (
    <ul className="space-y-2">
      {enrollments.map((enrollment) => (
        <li
          key={enrollment.id}
          className="flex items-center justify-between text-sm"
        >
          <span className="font-medium">{formatStudentName(enrollment.user)}</span>
          <span className="text-muted-foreground text-xs">
            {format(new Date(enrollment.joinedAt), 'yyyy/MM/dd HH:mm', { locale: zhTW })}
          </span>
        </li>
      ))}
    </ul>
  )
}
