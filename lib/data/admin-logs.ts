/*
 * ----------------------------------------------
 * Data Layer - 管理操作紀錄查詢
 * 2026-07-14 (Updated: 2026-08-28)
 * lib/data/admin-logs.ts
 * ----------------------------------------------
 */

import { prisma } from '@/lib/prisma'
import type { Prisma } from '@prisma/client'
import { ADMIN_LOG_ACTION_VALUES } from '@/config/admin-log-action'

const PAGE_SIZE = 30

const LOG_SNAPSHOT_SELECT = {
  id: true,
  action: true,
  actorName: true,
  targetName: true,
  inviteTitle: true,
  detail: true,
  createdAt: true,
} as const

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

/** YYYY-MM-DD → 當日起點（本地 00:00:00.000）；非法字串回 null */
function parseDayStart(s?: string): Date | null {
  if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return null
  const d = new Date(`${s}T00:00:00`)
  return isNaN(d.getTime()) ? null : d
}

/** YYYY-MM-DD → 當日終點（本地 23:59:59.999）；非法字串回 null */
function parseDayEnd(s?: string): Date | null {
  if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return null
  const d = new Date(`${s}T23:59:59.999`)
  return isNaN(d.getTime()) ? null : d
}

/**
 * 後台「系統活動紀錄」查詢（全系統、最新在前、每頁 30 筆）
 * 支援動作類型 / 關鍵字（比對 actor/target/invite/detail 快照）/ 起訖日期，皆為選填、可組合。
 * 無效參數（未知動作代碼、非法日期字串）一律忽略，不拋錯。
 */
export async function getAdminActivityLogs(params: {
  page?: number
  action?: string
  keyword?: string
  dateFrom?: string
  dateTo?: string
}): Promise<AdminLogList> {
  const page = Math.max(1, params.page ?? 1)

  const where: Prisma.AdminActionLogWhereInput = {}

  if (params.action && (ADMIN_LOG_ACTION_VALUES as string[]).includes(params.action)) {
    where.action = params.action
  }

  const keyword = params.keyword?.trim()
  if (keyword) {
    where.OR = (['actorName', 'targetName', 'inviteTitle', 'detail'] as const).map((field) => ({
      [field]: { contains: keyword, mode: 'insensitive' as const },
    }))
  }

  const from = parseDayStart(params.dateFrom)
  const to = parseDayEnd(params.dateTo)
  if (from || to) {
    where.createdAt = {
      ...(from ? { gte: from } : {}),
      ...(to ? { lte: to } : {}),
    }
  }

  const [total, items] = await Promise.all([
    prisma.adminActionLog.count({ where }),
    prisma.adminActionLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: LOG_SNAPSHOT_SELECT,
    }),
  ])

  return {
    items,
    total,
    page,
    totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  }
}
