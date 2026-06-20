/*
 * ----------------------------------------------
 * 會員多重身分授權工具
 * 2026-06-05 (Updated: 2026-06-20)
 * lib/auth-roles.ts
 *
 * 身分集合（roles）授權判定的單一真實來源。
 * 身分：user（一般會員，基線）/ teacher_1~teacher_4（四個書籍講師）/
 *       admin（管理者）/ superadmin（超級管理者）
 * 講師資格依書籍區分，「身分↔書籍」對應亦集中於此（單一真實來源）。
 * ----------------------------------------------
 */

import type { UserRole } from '@prisma/client'

// 書籍講師身分清單（依 courseCatalogId 順序）
export const TEACHER_ROLES = ['teacher_1', 'teacher_2', 'teacher_3', 'teacher_4'] as const
export type TeacherRole = (typeof TEACHER_ROLES)[number]

// 書籍講師身分 ↔ 課程目錄（CourseCatalog.id）對應（單一真實來源）
export const TEACHER_ROLE_BY_CATALOG: Record<number, TeacherRole> = {
  1: 'teacher_1', // 啟動靈人
  2: 'teacher_2', // 啟動豐盛
  3: 'teacher_3', // 啟動得勝
  4: 'teacher_4', // 啟動事工 4
}

// 反向對應：講師身分 → 課程目錄 id
export const CATALOG_BY_TEACHER_ROLE: Record<TeacherRole, number> = {
  teacher_1: 1,
  teacher_2: 2,
  teacher_3: 3,
  teacher_4: 4,
}

// 書籍講師身分 → 書名（繁體中文）
export const BOOK_LABEL_BY_TEACHER_ROLE: Record<TeacherRole, string> = {
  teacher_1: '啟動靈人',
  teacher_2: '啟動豐盛',
  teacher_3: '啟動得勝',
  teacher_4: '啟動事工 4',
}

// 身分顯示名稱對應（繁體中文）
export const ROLE_LABELS: Record<UserRole, string> = {
  user: '一般會員',
  teacher_1: '啟動靈人講師',
  teacher_2: '啟動豐盛講師',
  teacher_3: '啟動得勝講師',
  teacher_4: '啟動事工 4 講師',
  admin: '管理者',
  superadmin: '超級管理者',
}

// 可由管理者加掛／移除的身分（user 為基線，不在此列）
export const ASSIGNABLE_ROLES: UserRole[] = [
  'teacher_1',
  'teacher_2',
  'teacher_3',
  'teacher_4',
  'admin',
  'superadmin',
]

type Roles = readonly string[] | null | undefined

/**
 * 判定身分集合是否含指定身分
 */
export function hasRole(roles: Roles, role: UserRole): boolean {
  return !!roles && roles.includes(role)
}

/**
 * 是否可存取後台（管理者或超級管理者）
 */
export function canAccessAdmin(roles: Roles): boolean {
  return hasRole(roles, 'admin') || hasRole(roles, 'superadmin')
}

/**
 * 是否為超級管理者
 */
export function isSuperadmin(roles: Roles): boolean {
  return hasRole(roles, 'superadmin')
}

/**
 * 是否具「某本書」的開課權限
 * 持有該書對應的講師身分，或為 admin／superadmin（不受書籍限制）
 */
export function canTeachBook(roles: Roles, courseCatalogId: number): boolean {
  if (canAccessAdmin(roles)) return true
  const required = TEACHER_ROLE_BY_CATALOG[courseCatalogId]
  return !!required && hasRole(roles, required)
}

/**
 * 是否具「任一本書」的開課權限（用於是否顯示開課入口／講師視圖）
 * 持有任一書籍講師身分，或為 admin／superadmin
 */
export function canTeachAny(roles: Roles): boolean {
  if (canAccessAdmin(roles)) return true
  return !!roles && TEACHER_ROLES.some((r) => roles.includes(r))
}

/**
 * 正規化身分集合：去重、過濾無效值，並確保恆含 user 基線
 */
export function normalizeRoles(roles: Roles): UserRole[] {
  const valid: UserRole[] = [
    'user',
    'teacher_1',
    'teacher_2',
    'teacher_3',
    'teacher_4',
    'admin',
    'superadmin',
  ]
  const set = new Set<UserRole>(['user'])
  if (roles) {
    for (const r of roles) {
      if ((valid as string[]).includes(r)) set.add(r as UserRole)
    }
  }
  // 依固定順序輸出，方便顯示一致
  return valid.filter((r) => set.has(r))
}
