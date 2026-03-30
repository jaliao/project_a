/*
 * ----------------------------------------------
 * Server Actions - 課程目錄管理（Admin）
 * 2026-03-30
 * app/actions/course-catalog.ts
 * ----------------------------------------------
 */

'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'

type ActionResponse = {
  success: boolean
  message?: string
  errors?: Record<string, string[]>
}

const updateCourseSchema = z.object({
  label: z.string().min(1, '課程名稱不可為空'),
  isActive: z.boolean(),
  prerequisiteIds: z.array(z.number().int().positive()),
})

// ── 更新課程設定（名稱、isActive、先修課程）──────────────
export async function updateCourse(
  id: number,
  data: {
    label: string
    isActive: boolean
    prerequisiteIds: number[]
  }
): Promise<ActionResponse> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, message: '請先登入' }

  const isAdmin = session.user.role === 'admin' || session.user.role === 'superadmin'
  if (!isAdmin) return { success: false, message: '無權限執行此操作' }

  const parsed = updateCourseSchema.safeParse(data)
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors }
  }

  const { label, isActive, prerequisiteIds } = parsed.data

  // 不允許設定自身為先修
  const filteredPrereqIds = prerequisiteIds.filter((pid) => pid !== id)

  await prisma.courseCatalog.update({
    where: { id },
    data: {
      label,
      isActive,
      prerequisites: {
        // 全量重設先修關聯
        set: filteredPrereqIds.map((pid) => ({ id: pid })),
      },
    },
  })

  revalidatePath('/admin/course-catalog')
  revalidatePath('/admin')

  return { success: true, message: '課程設定已更新' }
}
