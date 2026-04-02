/*
 * ----------------------------------------------
 * Server Actions - 後台系統設定
 * 2026-04-02
 * app/actions/admin-settings.ts
 * ----------------------------------------------
 */

'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { upsertAdminSetting } from '@/lib/data/admin-settings'

export type ActionResponse = {
  success: boolean
  message?: string
  errors?: Record<string, string[]>
}

export async function updateHierarchyDepth(depth: number): Promise<ActionResponse> {
  const session = await auth()
  if (session?.user?.role !== 'superadmin') {
    return { success: false, message: '權限不足' }
  }

  if (!Number.isInteger(depth) || depth < 1 || depth > 10) {
    return {
      success: false,
      errors: { depth: ['請輸入 1–10 之間的整數'] },
    }
  }

  await upsertAdminSetting('hierarchy_depth', String(depth))
  revalidatePath('/admin/settings')

  return { success: true, message: '設定已儲存' }
}
