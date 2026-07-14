/*
 * ----------------------------------------------
 * 登入帳號 Email 變更共用邏輯
 * 2026-07-14
 * lib/account-email-change.ts
 *
 * 供「本人帳號修改」與「管理者帳號修改」共用：
 * 正規化＋唯一性檢查後，交易內更新 User.email、
 * 停用舊 email 白名單、新 email 白名單 upsert。
 * 不動 commEmail、Account（Google 綁定）與課程資料。
 * ----------------------------------------------
 */

import { z } from 'zod'
import { prisma } from '@/lib/prisma'

const emailSchema = z.string().trim().toLowerCase().email('Email 格式不正確')

export type EmailChangeCheck =
  | { ok: true; email: string }
  | { ok: false; errors: Record<string, string[]> }

/**
 * 正規化＋格式與唯一性檢查（不寫入）
 * @param userId 變更對象（唯一性檢查排除本人）
 * @param currentEmail 目前登入 email
 */
export async function validateNewAccountEmail(
  userId: string,
  currentEmail: string,
  input: string
): Promise<EmailChangeCheck> {
  const parsed = emailSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, errors: { email: parsed.error.flatten().formErrors } }
  }
  const next = parsed.data

  if (next === currentEmail.toLowerCase()) {
    return { ok: false, errors: { email: ['與目前帳號相同'] } }
  }

  const taken = await prisma.user.findFirst({
    where: { email: next, id: { not: userId } },
    select: { id: true },
  })
  if (taken) return { ok: false, errors: { email: ['此 Email 已被使用'] } }

  return { ok: true, email: next }
}

/**
 * 執行帳號 email 變更（單一交易）：
 * 更新 User.email、停用舊 email 白名單、新 email 白名單啟用
 */
export async function applyAccountEmailChange(
  userId: string,
  oldEmail: string,
  newEmail: string
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    await tx.user.update({ where: { id: userId }, data: { email: newEmail } })
    // 舊 email 白名單停用（查無列即略過；保留紀錄不刪除）
    await tx.whitelistedEmail.updateMany({
      where: { email: oldEmail.toLowerCase() },
      data: { isActive: false },
    })
    await tx.whitelistedEmail.upsert({
      where: { email: newEmail },
      update: { isActive: true },
      create: { email: newEmail, isActive: true },
    })
  })
}
