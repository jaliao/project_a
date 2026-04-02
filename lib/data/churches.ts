/*
 * ----------------------------------------------
 * Data Layer - 教會/單位管理
 * 2026-04-02
 * lib/data/churches.ts
 * ----------------------------------------------
 */

import { prisma } from '@/lib/prisma'

const ORDER = { orderBy: [{ sortOrder: 'asc' as const }, { id: 'asc' as const }] }

export async function getActiveChurches() {
  return prisma.church.findMany({
    where: { isActive: true },
    ...ORDER,
  })
}

export async function getAllChurches() {
  return prisma.church.findMany({ ...ORDER })
}

export async function getChurchMemberCount(churchId: number): Promise<number> {
  return prisma.user.count({
    where: { churchId, churchType: 'church' },
  })
}

export async function createChurch(name: string, sortOrder?: number) {
  const maxOrder = sortOrder ?? (await getNextSortOrder())
  return prisma.church.create({
    data: { name: name.trim(), sortOrder: maxOrder },
  })
}

export async function updateChurch(id: number, data: { name?: string; sortOrder?: number }) {
  return prisma.church.update({
    where: { id },
    data: {
      ...(data.name !== undefined ? { name: data.name.trim() } : {}),
      ...(data.sortOrder !== undefined ? { sortOrder: data.sortOrder } : {}),
    },
  })
}

export async function toggleChurchActive(id: number) {
  const church = await prisma.church.findUniqueOrThrow({ where: { id } })
  return prisma.church.update({
    where: { id },
    data: { isActive: !church.isActive },
  })
}

export async function deleteChurch(id: number) {
  const memberCount = await getChurchMemberCount(id)
  if (memberCount > 0) {
    throw new Error(`尚有 ${memberCount} 位會員關聯此教會，無法刪除`)
  }
  return prisma.church.delete({ where: { id } })
}

async function getNextSortOrder(): Promise<number> {
  const last = await prisma.church.findFirst({ orderBy: { sortOrder: 'desc' } })
  return (last?.sortOrder ?? 0) + 1
}

export type ChurchItem = Awaited<ReturnType<typeof getAllChurches>>[number]
