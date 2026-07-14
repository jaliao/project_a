/*
 * ----------------------------------------------
 * 後台建立可登入會員共用邏輯
 * 2026-07-14
 * lib/member-creation.ts
 *
 * 供「後台新增會員」與「班級新增學員」共用：
 * 核發 spiritId、產生臨時密碼（bcrypt、isTempPassword=true）、
 * 建立 User 並將 email 加入白名單。可於交易內呼叫。
 * ----------------------------------------------
 */

import { randomBytes } from 'crypto'
import bcrypt from 'bcryptjs'
import type { Prisma, UserRole } from '@prisma/client'
import { generateSpiritId } from '@/lib/spirit-id'

/** 產生 12 碼英數臨時密碼 */
export function generateTempPassword(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  const bytes = randomBytes(12)
  return Array.from(bytes)
    .map((b) => chars[b % chars.length])
    .join('')
}

export type CreatedMember = {
  userId: string
  spiritId: string
  tempPassword: string
}

/**
 * 於交易內建立可登入會員：核發 spiritId、臨時密碼、白名單
 * 呼叫端負責 email 唯一性檢查與權限判定
 * 注意：spiritId 計數器走全域連線，交易回滾時流水號會跳號（可接受）
 */
export async function createLoginableMember(
  tx: Prisma.TransactionClient,
  input: { realName: string; email: string; roles: UserRole[] }
): Promise<CreatedMember> {
  const { realName, email, roles } = input

  const spiritId = await generateSpiritId()
  const tempPassword = generateTempPassword()
  const passwordHash = await bcrypt.hash(tempPassword, 12)

  const user = await tx.user.create({
    data: {
      email,
      realName,
      nickname: realName,
      spiritId,
      roles,
      passwordHash,
      isTempPassword: true,
    },
    select: { id: true },
  })

  // 加入白名單（可登入）
  await tx.whitelistedEmail.upsert({
    where: { email },
    update: { isActive: true },
    create: { email, isActive: true },
  })

  return { userId: user.id, spiritId, tempPassword }
}
