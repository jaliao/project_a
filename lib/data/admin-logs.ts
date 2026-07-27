/*
 * ----------------------------------------------
 * Data Layer - 管理操作紀錄查詢
 * 2026-07-14
 * lib/data/admin-logs.ts
 * ----------------------------------------------
 */

import { prisma } from '@/lib/prisma'

const PAGE_SIZE = 30

export type AdminLogItem = {
  id: number
  action: string
  actorName: string
  targetName: string
  inviteTitle: string | null
  detail: string | null
  createdAt: Date
}

export type AdminLogList = {
  items: AdminLogItem[]
  total: number
  page: number
  totalPages: number
}

/**
 * 操作紀錄清單（最新在前、每頁 30 筆；可依班級過濾）
 * 一律以快照欄呈現，不 join 會員/班級（對象被刪除後仍完整可讀）
 */
export async function getAdminLogs(params: {
  page?: number
  inviteId?: number
}): Promise<AdminLogList> {
  const page = Math.max(1, params.page ?? 1)
  const where = params.inviteId ? { inviteId: params.inviteId } : {}

  const [total, items] = await Promise.all([
    prisma.adminActionLog.count({ where }),
    prisma.adminActionLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        action: true,
        actorName: true,
        targetName: true,
        inviteTitle: true,
        detail: true,
        createdAt: true,
      },
    }),
  ])

  return {
    items,
    total,
    page,
    totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  }
}
