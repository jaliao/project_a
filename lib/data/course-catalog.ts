/*
 * ----------------------------------------------
 * Data Layer - 課程目錄查詢
 * 2026-03-30
 * lib/data/course-catalog.ts
 * ----------------------------------------------
 */

import { prisma } from '@/lib/prisma'

export type CourseCatalogEntry = {
  id: number
  label: string
  isActive: boolean
  sortOrder: number
  prerequisites: { id: number; label: string }[]
}

/** 取得所有課程，依 sortOrder 排序 */
export async function getAllCourses(): Promise<CourseCatalogEntry[]> {
  return prisma.courseCatalog.findMany({
    orderBy: { sortOrder: 'asc' },
    select: {
      id: true,
      label: true,
      isActive: true,
      sortOrder: true,
      prerequisites: { select: { id: true, label: true } },
    },
  })
}

/** 取得所有開放中的課程（isActive = true） */
export async function getActiveCourses(): Promise<CourseCatalogEntry[]> {
  return prisma.courseCatalog.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
    select: {
      id: true,
      label: true,
      isActive: true,
      sortOrder: true,
      prerequisites: { select: { id: true, label: true } },
    },
  })
}

/** 取得單一課程設定 */
export async function getCourse(id: number): Promise<CourseCatalogEntry | null> {
  return prisma.courseCatalog.findUnique({
    where: { id },
    select: {
      id: true,
      label: true,
      isActive: true,
      sortOrder: true,
      prerequisites: { select: { id: true, label: true } },
    },
  })
}

/** 取得指定課程的先修課程清單 */
export async function getPrerequisites(
  catalogId: number
): Promise<{ id: number; label: string }[]> {
  const course = await prisma.courseCatalog.findUnique({
    where: { id: catalogId },
    select: { prerequisites: { select: { id: true, label: true } } },
  })
  return course?.prerequisites ?? []
}

/**
 * 驗證使用者是否已完成目標課程的所有先修課程
 * 回傳使用者尚未完成的先修課程清單（空陣列代表通過）
 */
export async function checkPrerequisites(
  userId: string,
  targetCatalogId: number
): Promise<{ id: number; label: string }[]> {
  // 取得目標課程的先修清單
  const prereqs = await getPrerequisites(targetCatalogId)
  if (prereqs.length === 0) return []

  // 取得使用者已結業的課程 id 集合
  const graduatedEnrollments = await prisma.inviteEnrollment.findMany({
    where: {
      userId,
      graduatedAt: { not: null },
    },
    select: {
      invite: { select: { courseCatalogId: true } },
    },
  })

  const graduatedCatalogIds = new Set(
    graduatedEnrollments.map((e) => e.invite.courseCatalogId)
  )

  // 回傳未完成的先修課程
  return prereqs.filter((p) => !graduatedCatalogIds.has(p.id))
}

/**
 * 取得使用者已結業的課程 id 集合
 */
export async function getGraduatedCatalogIds(userId: string): Promise<Set<number>> {
  const rows = await prisma.inviteEnrollment.findMany({
    where: { userId, graduatedAt: { not: null } },
    select: { invite: { select: { courseCatalogId: true } } },
  })
  return new Set(rows.map((r) => r.invite.courseCatalogId))
}
