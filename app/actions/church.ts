/*
 * ----------------------------------------------
 * Server Actions - 教會/單位管理
 * 2026-04-02
 * app/actions/church.ts
 * ----------------------------------------------
 */

'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import {
  createChurch,
  updateChurch,
  toggleChurchActive,
  deleteChurch,
} from '@/lib/data/churches'

export type ActionResponse = {
  success: boolean
  message?: string
  errors?: Record<string, string[]>
}

async function requireAdmin(): Promise<boolean> {
  const session = await auth()
  const role = session?.user?.role
  return role === 'admin' || role === 'superadmin'
}

export async function createChurchAction(
  name: string,
  sortOrder?: number
): Promise<ActionResponse> {
  if (!(await requireAdmin())) return { success: false, message: '權限不足' }
  if (!name.trim()) return { success: false, errors: { name: ['名稱不可為空'] } }

  try {
    await createChurch(name, sortOrder)
    revalidatePath('/admin/settings')
    return { success: true, message: '教會已新增' }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : '新增失敗'
    return { success: false, message: msg }
  }
}

export async function updateChurchAction(
  id: number,
  name: string,
  sortOrder: number
): Promise<ActionResponse> {
  if (!(await requireAdmin())) return { success: false, message: '權限不足' }
  if (!name.trim()) return { success: false, errors: { name: ['名稱不可為空'] } }

  try {
    await updateChurch(id, { name, sortOrder })
    revalidatePath('/admin/settings')
    return { success: true, message: '已更新' }
  } catch {
    return { success: false, message: '更新失敗' }
  }
}

export async function toggleChurchActiveAction(id: number): Promise<ActionResponse> {
  if (!(await requireAdmin())) return { success: false, message: '權限不足' }

  try {
    await toggleChurchActive(id)
    revalidatePath('/admin/settings')
    return { success: true }
  } catch {
    return { success: false, message: '操作失敗' }
  }
}

export async function deleteChurchAction(id: number): Promise<ActionResponse> {
  if (!(await requireAdmin())) return { success: false, message: '權限不足' }

  try {
    await deleteChurch(id)
    revalidatePath('/admin/settings')
    return { success: true, message: '教會已刪除' }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : '刪除失敗'
    return { success: false, message: msg }
  }
}
