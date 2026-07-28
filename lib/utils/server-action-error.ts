/*
 * ----------------------------------------------
 * Server Action 部署版本不符偵測
 * 2026-07-24
 * lib/utils/server-action-error.ts
 *
 * 正式環境重新部署時，若使用者分頁停留在舊版本，送出表單會呼叫舊版
 * 編譯出的 Server Action ID，框架層會拋出下方訊息的錯誤（見
 * cr-spec-260724-002 事故：2026-07-24 聯繫管理者提問遺失）。
 * ----------------------------------------------
 */

export function isDeploymentMismatchError(error: unknown): boolean {
  return (
    error instanceof Error &&
    error.message.includes('Failed to find Server Action') &&
    error.message.includes('older or newer deployment')
  )
}
