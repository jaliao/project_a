/*
 * ----------------------------------------------
 * Server Actions - 課程 FAQ 留言
 * 2026-06-11
 * app/actions/course-message.ts
 * ----------------------------------------------
 */

'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { courseMessageSchema } from '@/lib/schemas/course-message'
import { createNotification } from '@/app/actions/notification'

type ActionResponse = {
  success: boolean
  message?: string
  errors?: Record<string, string[]>
}

// ── 會員提問（任何登入會員）──
export async function postCourseQuestion(
  inviteId: number,
  body: string
): Promise<ActionResponse> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, message: '請先登入' }

  const parsed = courseMessageSchema.safeParse({ body })
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors }
  }

  const invite = await prisma.courseInvite.findUnique({
    where: { id: inviteId },
    select: { id: true, title: true, createdById: true },
  })
  if (!invite) return { success: false, message: '找不到課程' }

  await prisma.courseMessage.create({
    data: { inviteId, authorId: session.user.id, body: parsed.data.body },
  })

  revalidatePath(`/course/${inviteId}`)

  // 通知授課老師（發問者本身即老師時略過）
  if (invite.createdById !== session.user.id) {
    try {
      await createNotification(
        invite.createdById,
        '課程有新提問',
        `「${invite.title}」課程有新的提問。`
      )
    } catch (e) {
      console.error('新提問通知寫入失敗', e)
    }
  }

  return { success: true, message: '已送出提問' }
}

// ── 授課老師回覆（僅開課者本人）──
export async function replyCourseMessage(
  parentId: number,
  body: string
): Promise<ActionResponse> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, message: '請先登入' }

  const parsed = courseMessageSchema.safeParse({ body })
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors }
  }

  const parent = await prisma.courseMessage.findUnique({
    where: { id: parentId },
    select: {
      id: true,
      parentId: true,
      authorId: true,
      inviteId: true,
      invite: { select: { title: true, createdById: true } },
    },
  })
  if (!parent) return { success: false, message: '找不到留言' }
  if (parent.parentId !== null) return { success: false, message: '無法回覆回覆' }
  if (parent.invite.createdById !== session.user.id) {
    return { success: false, message: '無權限' }
  }

  await prisma.courseMessage.create({
    data: { inviteId: parent.inviteId, authorId: session.user.id, body: parsed.data.body, parentId },
  })

  revalidatePath(`/course/${parent.inviteId}`)

  // 通知提問者（老師回覆自己提問時略過）
  if (parent.authorId !== session.user.id) {
    try {
      await createNotification(
        parent.authorId,
        '課程提問已回覆',
        `您在「${parent.invite.title}」課程的提問已獲老師回覆。`
      )
    } catch (e) {
      console.error('回覆通知寫入失敗', e)
    }
  }

  return { success: true, message: '已送出回覆' }
}

// ── 刪除留言（作者本人或該課程授課老師；刪提問 cascade 刪回覆）──
export async function deleteCourseMessage(messageId: number): Promise<ActionResponse> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, message: '請先登入' }

  const message = await prisma.courseMessage.findUnique({
    where: { id: messageId },
    select: {
      id: true,
      authorId: true,
      inviteId: true,
      invite: { select: { createdById: true } },
    },
  })
  if (!message) return { success: false, message: '找不到留言' }

  const isAuthor = message.authorId === session.user.id
  const isInstructor = message.invite.createdById === session.user.id
  if (!isAuthor && !isInstructor) return { success: false, message: '無權限' }

  await prisma.courseMessage.delete({ where: { id: messageId } })

  revalidatePath(`/course/${message.inviteId}`)
  return { success: true, message: '已刪除' }
}
