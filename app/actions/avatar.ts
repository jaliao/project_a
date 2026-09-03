/*
 * ----------------------------------------------
 * Server Actions - 使用者頭像上傳/移除
 * 2026-08-03 (Updated: 2026-09-03)
 * app/actions/avatar.ts
 *
 * cr-spec-260903-001：成功/登入訊息統一為 i18n key（失敗鍵沿用既有 validation.*）
 * ----------------------------------------------
 */

'use server'

import { randomUUID } from 'crypto'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { uploadToR2, deleteFromR2 } from '@/lib/storage/r2'

type ActionResponse = {
  success: boolean
  message?: string
}

const ALLOWED_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

const MAX_SIZE = 2 * 1024 * 1024 // 2MB

// ── 上傳/更換頭像 ──────────────────────────────
export async function uploadAvatar(formData: FormData): Promise<ActionResponse> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, message: 'profile.toast.mustLogin' }

  const file = formData.get('file')
  if (!(file instanceof File)) {
    return { success: false, message: 'validation.avatarTypeInvalid' }
  }

  const ext = ALLOWED_TYPES[file.type]
  if (!ext) {
    return { success: false, message: 'validation.avatarTypeInvalid' }
  }
  if (file.size > MAX_SIZE) {
    return { success: false, message: 'validation.avatarTooLarge' }
  }

  const existing = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { avatarKey: true },
  })

  const key = `avatars/${session.user.id}/${randomUUID()}.${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())
  await uploadToR2(key, buffer, file.type)

  await prisma.user.update({
    where: { id: session.user.id },
    data: { avatarKey: key },
  })

  if (existing?.avatarKey) {
    deleteFromR2(existing.avatarKey).catch((e) => {
      console.error('[avatar] 刪除舊頭像失敗', e)
    })
  }

  revalidatePath('/', 'layout')
  return { success: true, message: 'profile.toast.avatarUpdated' }
}

// ── 移除頭像 ──────────────────────────────────
export async function removeAvatar(): Promise<ActionResponse> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, message: 'profile.toast.mustLogin' }

  const existing = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { avatarKey: true },
  })
  if (!existing?.avatarKey) {
    return { success: true, message: 'profile.toast.avatarRemoved' }
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { avatarKey: null },
  })

  deleteFromR2(existing.avatarKey).catch((e) => {
    console.error('[avatar] 刪除頭像失敗', e)
  })

  revalidatePath('/', 'layout')
  return { success: true, message: 'profile.toast.avatarRemoved' }
}
