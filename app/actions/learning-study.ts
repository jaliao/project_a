/*
 * ----------------------------------------------
 * Server Actions - 我的學習（分段查經筆記）
 * 2026-08-28
 * app/actions/learning-study.ts
 * ----------------------------------------------
 */

'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { isValidOutlinePath } from '@/config/learning-outline'
import { getUnlockedLearningCatalogIds } from '@/lib/data/learning-study'
import { createStudyEntrySchema, studyEntryContentSchema } from '@/lib/schemas/learning-study'

type ActionResponse = {
  success: boolean
  message?: string
  errors?: Record<string, string[]>
}

function revalidateLearning() {
  revalidatePath('/[locale]/user/[spiritId]/learning', 'page')
}

// 內容欄位正規化：空字串 → null
function normalizeContent(d: {
  mainTitle: string
  subTitle?: string
  wordReceived?: string
  application?: string
}) {
  const clean = (v?: string) => {
    const t = (v ?? '').trim()
    return t.length > 0 ? t : null
  }
  return {
    mainTitle: d.mainTitle.trim(),
    subTitle: clean(d.subTitle),
    wordReceived: clean(d.wordReceived),
    application: clean(d.application),
  }
}

// ── 新增一筆分段查經筆記 ──
export async function createStudyEntry(input: Record<string, unknown>): Promise<ActionResponse> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, message: '請先登入' }

  const parsed = createStudyEntrySchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors }
  }
  const d = parsed.data

  // 大綱位置需合法（課次存在、經文項目掛在該課次下）
  if (!isValidOutlinePath(d.courseCatalogId, d.lessonKey, d.scriptureKey)) {
    return { success: false, message: '大綱位置不存在' }
  }

  // 目標課程目錄需為本人已解鎖
  const unlocked = await getUnlockedLearningCatalogIds(session.user.id)
  if (!unlocked.includes(d.courseCatalogId)) {
    return { success: false, message: '需先開始上課才能撰寫此課程的學習筆記' }
  }

  await prisma.learningStudyEntry.create({
    data: {
      userId: session.user.id,
      courseCatalogId: d.courseCatalogId,
      lessonKey: d.lessonKey,
      scriptureKey: d.scriptureKey,
      ...normalizeContent(d),
    },
  })

  revalidateLearning()
  return { success: true, message: '已新增' }
}

// ── 編輯既有筆記（僅四個內容欄位；不重驗解鎖條件）──
export async function updateStudyEntry(
  id: number,
  input: Record<string, unknown>
): Promise<ActionResponse> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, message: '請先登入' }

  const entry = await prisma.learningStudyEntry.findUnique({
    where: { id },
    select: { id: true, userId: true },
  })
  if (!entry) return { success: false, message: '找不到筆記' }
  if (entry.userId !== session.user.id) return { success: false, message: '無權限' }

  const parsed = studyEntryContentSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors }
  }

  await prisma.learningStudyEntry.update({
    where: { id },
    data: normalizeContent(parsed.data),
  })

  revalidateLearning()
  return { success: true, message: '已更新' }
}

// ── 刪除筆記（不重驗解鎖條件）──
export async function deleteStudyEntry(id: number): Promise<ActionResponse> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, message: '請先登入' }

  const entry = await prisma.learningStudyEntry.findUnique({
    where: { id },
    select: { id: true, userId: true },
  })
  if (!entry) return { success: false, message: '找不到筆記' }
  if (entry.userId !== session.user.id) return { success: false, message: '無權限' }

  await prisma.learningStudyEntry.delete({ where: { id } })

  revalidateLearning()
  return { success: true, message: '已刪除' }
}
