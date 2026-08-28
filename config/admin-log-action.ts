/*
 * ----------------------------------------------
 * 管理操作紀錄動作定義（config-driven）
 * 2026-07-14 (Updated: 2026-08-28)
 * config/admin-log-action.ts
 * ----------------------------------------------
 */

// label：清單頁動作標籤；trigger：規則說明頁的「何時、由誰操作會產生此紀錄」說明
export const ADMIN_LOG_ACTIONS = {
  enrollment_add: {
    label: '新增學員',
    trigger: '管理者或該課授課老師於課程詳情頁「新增學員」成功加入一位已核准學員時（可含補登結業）。',
  },
  enrollment_remove: {
    label: '移除學員',
    trigger: '管理者或該課授課老師於課程詳情頁「移除學員」成功移除一位學員時（須填寫移除原因）。',
  },
  material_finalize: {
    label: '完成教材申請',
    trigger: '講師或管理者於課程詳情頁按「已完成申請」，將該課教材申請標記為完成時。',
  },
  material_reopen: {
    label: '重新開放教材申請',
    trigger: '講師或管理者於課程詳情頁按「重新開放申請」，解除教材申請完成標記時。',
  },
  member_delete: {
    label: '刪除會員',
    trigger: '管理者於會員詳情頁刪除一個會員帳號時（此類紀錄無關聯班級）。',
  },
} as const

export type AdminLogAction = keyof typeof ADMIN_LOG_ACTIONS

export const ADMIN_LOG_ACTION_VALUES = Object.keys(ADMIN_LOG_ACTIONS) as AdminLogAction[]

/** 取得動作顯示標籤（未知代碼原樣顯示） */
export function getAdminLogActionLabel(action: string): string {
  return ADMIN_LOG_ACTIONS[action as AdminLogAction]?.label ?? action
}
