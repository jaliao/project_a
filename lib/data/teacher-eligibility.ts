/*
 * ----------------------------------------------
 * 資料存取層 - 講師資格檢查
 * 2026-10-24
 * lib/data/teacher-eligibility.ts
 * ----------------------------------------------
 */

import { prisma } from '@/lib/prisma'

// 判定使用者是否已有至少一筆對應書籍（courseCatalogId）的已結業報名紀錄
export async function hasGraduatedBook(
  userId: string,
  courseCatalogId: number
): Promise<boolean> {
  const enrollment = await prisma.inviteEnrollment.findFirst({
    where: { userId, graduatedAt: { not: null }, invite: { courseCatalogId } },
    select: { id: true },
  })
  return !!enrollment
}
