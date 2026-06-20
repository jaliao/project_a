/*
 * ----------------------------------------------
 * 會員顯示名稱 Helper
 * 2026-04-02 (Updated: 2026-06-20)
 * lib/utils/member-display.ts
 *
 * 顯示名稱規則（系統標準／資安）：
 * - 基底：暱稱 nickname → 中文名稱 realName → 英文名稱 englishName（皆無 → 「（未填）」）
 * - 模式 nickname：僅基底
 * - 模式 nickname_zh：基底（realName）
 * - 模式 nickname_en：基底（englishName）
 * - 括號內名稱為空、或與基底相同 → 省略括號
 * - 名稱不退回 name / email（email 僅作聯繫用途，另行顯示，非作名稱）
 * ----------------------------------------------
 */

export type DisplayNameMode = 'nickname' | 'nickname_zh' | 'nickname_en'

type MemberDisplayInput = {
  realName?: string | null
  englishName?: string | null
  nickname?: string | null
  displayNameMode?: DisplayNameMode | null
}

export function getMemberDisplayName(user: MemberDisplayInput): string {
  // 基底：暱稱 → 中文名稱 → 英文名稱
  const base = user.nickname || user.realName || user.englishName || ''
  if (!base) return '（未填）'

  const mode = user.displayNameMode ?? 'nickname'
  const suffix =
    mode === 'nickname_zh'
      ? user.realName || ''
      : mode === 'nickname_en'
        ? user.englishName || ''
        : ''

  if (!suffix || suffix === base) return base
  return `${base}（${suffix}）`
}
