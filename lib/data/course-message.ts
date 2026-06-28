/*
 * ----------------------------------------------
 * Data Layer - 課程 FAQ 留言查詢
 * 2026-06-11
 * lib/data/course-message.ts
 * ----------------------------------------------
 */

import { prisma } from '@/lib/prisma'
import { getMemberDisplayName } from '@/lib/utils/member-display'

export type CourseMessageReply = {
  id: number
  authorId: string
  authorName: string
  body: string
  createdAt: Date
}

export type CourseMessageThread = CourseMessageReply & {
  replies: CourseMessageReply[]
}

const authorSelect = {
  id: true,
  realName: true,
  englishName: true,
  nickname: true,
  name: true,
  displayNameMode: true,
} as const

/**
 * 取得課程 FAQ 留言（提問升序，回覆內嵌升序）
 * 1 對 1 可見性：授課老師見全部；其他會員僅見自己張貼的提問串
 */
export async function getCourseMessages(
  inviteId: number,
  viewer: { userId: string; isInstructor: boolean }
): Promise<CourseMessageThread[]> {
  const messages = await prisma.courseMessage.findMany({
    where: viewer.isInstructor
      ? { inviteId, parentId: null }
      : { inviteId, parentId: null, authorId: viewer.userId },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      authorId: true,
      body: true,
      createdAt: true,
      author: { select: authorSelect },
      replies: {
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          authorId: true,
          body: true,
          createdAt: true,
          author: { select: authorSelect },
        },
      },
    },
  })

  return messages.map((m) => ({
    id: m.id,
    authorId: m.authorId,
    authorName: getMemberDisplayName(m.author),
    body: m.body,
    createdAt: m.createdAt,
    replies: m.replies.map((r) => ({
      id: r.id,
      authorId: r.authorId,
      authorName: getMemberDisplayName(r.author),
      body: r.body,
      createdAt: r.createdAt,
    })),
  }))
}
