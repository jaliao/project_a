/*
 * ----------------------------------------------
 * 會員多重身分授權工具
 * 2026-06-05
 * lib/auth-roles.ts
 *
 * 身分集合（roles）授權判定的單一真實來源。
 * 身分：user（一般會員，基線）/ teacher（講師）/ admin（管理者）/ superadmin（超級管理者）
 * ----------------------------------------------
 */

import type { UserRole } from '@prisma/client'

// 身分顯示名稱對應（繁體中文）
export const ROLE_LABELS: Record<UserRole, string> = {
  user: '一般會員',
  teacher: '講師',
  admin: '管理者',
  superadmin: '超級管理者',
}

// 可由管理者加掛／移除的身分（user 為基線，不在此列）
export const ASSIGNABLE_ROLES: UserRole[] = ['teacher', 'admin', 'superadmin']

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
 * 是否具開課權限（講師、管理者或超級管理者）
 */
export function canTeach(roles: Roles): boolean {
  return hasRole(roles, 'teacher') || canAccessAdmin(roles)
}

/**
 * 正規化身分集合：去重、過濾無效值，並確保恆含 user 基線
 */
export function normalizeRoles(roles: Roles): UserRole[] {
  const valid: UserRole[] = ['user', 'teacher', 'admin', 'superadmin']
  const set = new Set<UserRole>(['user'])
  if (roles) {
    for (const r of roles) {
      if ((valid as string[]).includes(r)) set.add(r as UserRole)
    }
  }
  // 依固定順序輸出，方便顯示一致
  return valid.filter((r) => set.has(r))
}
