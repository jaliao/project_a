/*
 * ----------------------------------------------
 * 資料存取層 - 使用者查詢
 * 2026-03-23
 * lib/data/user.ts
 * ----------------------------------------------
 */

import { prisma } from '@/lib/prisma'

export async function getUserByEmail(email: string) {
  return prisma.user.findUnique({ where: { email } })
}

export async function getUserById(id: string) {
  return prisma.user.findUnique({ where: { id } })
}
