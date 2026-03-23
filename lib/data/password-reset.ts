/*
 * ----------------------------------------------
 * 資料存取層 - 密碼重設 Token
 * 2026-03-23
 * lib/data/password-reset.ts
 * ----------------------------------------------
 */

import { prisma } from '@/lib/prisma'

export async function getValidResetToken(token: string) {
  return prisma.passwordResetToken.findFirst({
    where: {
      token,
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
  })
}

export async function markTokenUsed(id: string) {
  return prisma.passwordResetToken.update({
    where: { id },
    data: { usedAt: new Date() },
  })
}
