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
import { isSuperadmin } from '@/lib/auth-roles'
import {
  upsertAdminSetting,
  REMITTANCE_ACCOUNT_KEY,
  GRADUATION_EMAIL_SUBJECT_KEY,
  GRADUATION_EMAIL_BODY_KEY,
  CLASS_MAX_CAPACITY_KEY,
} from '@/lib/data/admin-settings'

export type ActionResponse = {
  success: boolean
  message?: string
  errors?: Record<string, string[]>
}

export async function updateHierarchyDepth(depth: number): Promise<ActionResponse> {
  const session = await auth()
  if (!isSuperadmin(session?.user?.roles)) {
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

export async function updateClassMaxCapacity(capacity: number): Promise<ActionResponse> {
  const session = await auth()
  if (!isSuperadmin(session?.user?.roles)) {
    return { success: false, message: '權限不足' }
  }

  if (!Number.isInteger(capacity) || capacity < 1 || capacity > 99) {
    return { success: false, errors: { capacity: ['請輸入 1–99 之間的整數'] } }
  }

  await upsertAdminSetting(CLASS_MAX_CAPACITY_KEY, String(capacity))
  revalidatePath('/admin/settings')

  return { success: true, message: '設定已儲存' }
}

export async function updateRemittanceAccount(account: string): Promise<ActionResponse> {
  const session = await auth()
  if (!isSuperadmin(session?.user?.roles)) {
    return { success: false, message: '權限不足' }
  }

  const trimmed = account.trim()
  if (!trimmed) {
    return { success: false, errors: { account: ['匯款帳號為必填'] } }
  }

  await upsertAdminSetting(REMITTANCE_ACCOUNT_KEY, trimmed)
  revalidatePath('/admin/settings')

  return { success: true, message: '匯款帳號已儲存' }
}

export async function updateGraduationEmailTemplate(
  subject: string,
  body: string
): Promise<ActionResponse> {
  const session = await auth()
  if (!isSuperadmin(session?.user?.roles)) {
    return { success: false, message: '權限不足' }
  }

  const s = subject.trim()
  const b = body.trim()
  if (!s) return { success: false, errors: { subject: ['主旨為必填'] } }
  if (!b) return { success: false, errors: { body: ['內文為必填'] } }

  await upsertAdminSetting(GRADUATION_EMAIL_SUBJECT_KEY, s)
  await upsertAdminSetting(GRADUATION_EMAIL_BODY_KEY, b)
  revalidatePath('/admin/settings')

  return { success: true, message: '結業信範本已儲存' }
}
