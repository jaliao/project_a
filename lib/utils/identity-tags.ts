/*
 * ----------------------------------------------
 * 身分標籤計算
 * 2026-08-04
 * lib/utils/identity-tags.ts
 *
 * 系統管理員優先，其餘依書籍講師身分（teacher_1~teacher_3）附加，
 * 邏輯移植自 user/[spiritId]/page.tsx 既有內嵌計算（cr-spec-260804-001）
 * ----------------------------------------------
 */

import { canAccessAdmin, TEACHER_ROLES, ROLE_LABELS, type Roles } from '@/lib/auth-roles'

export function getIdentityTags(roles: Roles): string[] {
  const tags: string[] = []
  if (canAccessAdmin(roles)) tags.push('系統管理員')
  for (const role of TEACHER_ROLES) {
    if (roles?.includes(role)) tags.push(ROLE_LABELS[role])
  }
  return tags
}
