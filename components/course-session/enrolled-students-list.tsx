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
import { getMemberDisplayName } from '@/lib/utils/member-display'

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
            select: { realName: true, englishName: true, nickname: true, name: true, displayNameMode: true },
          },
        },
      },
    },
  })

  return latestInvite?.enrollments ?? []
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
          <span className="font-medium">{getMemberDisplayName(enrollment.user)}</span>
          <span className="text-muted-foreground text-xs">
            {format(new Date(enrollment.joinedAt), 'yyyy/MM/dd HH:mm', { locale: zhTW })}
          </span>
        </li>
      ))}
    </ul>
  )
}
