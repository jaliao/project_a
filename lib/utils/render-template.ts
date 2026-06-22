/*
 * ----------------------------------------------
 * 範本變數替換（{{key}} → 值）
 * 2026-06-21
 * lib/utils/render-template.ts
 *
 * 純函式：將範本中的 {{key}} 以 vars[key] 替換；
 * 未提供的變數原樣保留，不拋出例外。
 * ----------------------------------------------
 */

export function renderTemplate(tpl: string, vars: Record<string, string>): string {
  return tpl.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, key: string) =>
    Object.prototype.hasOwnProperty.call(vars, key) ? vars[key] : match
  )
}
