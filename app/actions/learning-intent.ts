/*
 * ----------------------------------------------
 * Server Actions - 學員上課意願
 * 2026-09-14
 * app/actions/learning-intent.ts
 * ----------------------------------------------
 */

'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { learningIntentSchema } from '@/lib/schemas/learning-intent'

type ActionResponse = {
  success: boolean
  message?: string
  errors?: Record<string, string[]>
}

function revalidateAfterChange() {
  revalidatePath('/[locale]/user/[spiritId]', 'page')
  revalidatePath('/[locale]/match-board', 'page')
}

// ── 建立／更新（upsert）本人的上課意願刊登 ──
export async function saveLearningIntent(input: unknown): Promise<ActionResponse> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, message: '請先登入' }

  const parsed = learningIntentSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors }
  }
  const d = parsed.data
  // 未勾選「其他」時清除 otherNote，避免殘留舊值
  const otherNote = d.timePreferences.includes('other') ? (d.otherNote ?? null) : null

  await prisma.learningIntent.upsert({
    where: { userId: session.user.id },
    create: {
      userId: session.user.id,
      courseCatalogIds: d.courseCatalogIds,
      timePreferences: d.timePreferences,
      otherNote,
    },
    update: {
      courseCatalogIds: d.courseCatalogIds,
      timePreferences: d.timePreferences,
      otherNote,
    },
  })

  revalidateAfterChange()
  return { success: true, message: '已刊登上課意願' }
}

// ── 取消本人的上課意願刊登 ──
export async function cancelLearningIntent(): Promise<ActionResponse> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, message: '請先登入' }

  await prisma.learningIntent.deleteMany({ where: { userId: session.user.id } })

  revalidateAfterChange()
  return { success: true, message: '已取消刊登' }
}
