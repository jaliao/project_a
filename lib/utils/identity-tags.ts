/*
 * ----------------------------------------------
 * 身分標籤計算
 * 2026-08-04 (Updated: 2026-10-23)
 * lib/utils/identity-tags.ts
 *
 * 單一商業邏輯來源：計算身分標籤陣列，供個人首頁、後台會員列表／詳情頁、
 * 疑似重複帳號比對卡片、選擇學員元件共用（CR-REFACTOR-261023-001）。
 * 標籤順序：未註冊學員（isProxyMember）→ 系統管理員 → 書籍講師（teacher_1~teacher_3）
 * → 一般會員（僅當呼叫端提供完整 roles 資料時才附加作為基準標籤）。
 * isProxyMember 省略時預設 false（供尚未追蹤此欄位的既有呼叫端，如 MemberTag，維持原行為）。
 * t 省略時維持原繁體標籤（供後台等非 i18n 情境使用）；
 * 傳入 t（限定在 role 命名空間，如 useTranslations('role')）時改走 i18n。
 * ----------------------------------------------
 */

import { canAccessAdmin, TEACHER_ROLES, ROLE_LABELS, type Roles } from '@/lib/auth-roles'

type RoleTranslator = (key: string) => string

export function getIdentityTags(roles: Roles, isProxyMember: boolean = false, t?: RoleTranslator): string[] {
  const tags: string[] = []
  if (isProxyMember) tags.push(t ? t('unregisteredStudent') : '未註冊學員')
  if (canAccessAdmin(roles)) tags.push(t ? t('systemAdmin') : '系統管理員')
  for (const role of TEACHER_ROLES) {
    if (roles?.includes(role)) tags.push(t ? t(role) : ROLE_LABELS[role])
  }
  // 基準身分：只有在呼叫端確實提供 roles 資料時才附加，不對未查詢 roles 的呼叫端猜測顯示
  if (roles) tags.push(t ? t('user') : ROLE_LABELS.user)
  return tags
}
