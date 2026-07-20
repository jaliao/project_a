/*
 * ----------------------------------------------
 * 管理操作紀錄動作定義（config-driven）
 * 2026-07-14
 * config/admin-log-action.ts
 * ----------------------------------------------
 */

export const ADMIN_LOG_ACTIONS = {
  enrollment_add: { label: '新增學員' },
  enrollment_remove: { label: '移除學員' },
  material_finalize: { label: '完成教材申請' },
  material_reopen: { label: '重新開放教材申請' },
} as const

export type AdminLogAction = keyof typeof ADMIN_LOG_ACTIONS

export const ADMIN_LOG_ACTION_VALUES = Object.keys(ADMIN_LOG_ACTIONS) as AdminLogAction[]

/** 取得動作顯示標籤（未知代碼原樣顯示） */
export function getAdminLogActionLabel(action: string): string {
  return ADMIN_LOG_ACTIONS[action as AdminLogAction]?.label ?? action
}
