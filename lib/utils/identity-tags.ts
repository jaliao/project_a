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

type RoleTranslator = (key: string) => string

/**
 * t 省略時維持原繁體 ROLE_LABELS（供後台等非 i18n 情境使用）；
 * 傳入 t（限定在 role 命名空間，如 useTranslations('role')）時改走 i18n。
 */
export function getIdentityTags(roles: Roles, t?: RoleTranslator): string[] {
  const tags: string[] = []
  if (canAccessAdmin(roles)) tags.push(t ? t('systemAdmin') : '系統管理員')
  for (const role of TEACHER_ROLES) {
    if (roles?.includes(role)) tags.push(t ? t(role) : ROLE_LABELS[role])
  }
  return tags
}
