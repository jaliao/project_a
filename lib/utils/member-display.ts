/*
 * ----------------------------------------------
 * 會員顯示名稱 Helper
 * 2026-04-02
 * lib/utils/member-display.ts
 *
 * 顯示規則：
 * - chinese 模式：匿名名稱 = nickname ?? realName ?? name
 * - english 模式：匿名名稱 = englishName ?? name ?? realName
 * - 匿名名稱 === realName → 直接顯示（省略括號）
 * - 匿名名稱 !== realName 且兩者有值 → {匿名名稱}（{realName}）
 * - 只有匿名名稱 → 匿名名稱
 * - 皆無 → （未填）
 * ----------------------------------------------
 */

type MemberDisplayInput = {
  realName?: string | null
  englishName?: string | null
  nickname?: string | null
  name?: string | null
  displayNameMode?: 'chinese' | 'english' | null
}

export function getMemberDisplayName(user: MemberDisplayInput): string {
  const mode = user.displayNameMode ?? 'chinese'

  const anonymous =
    mode === 'english'
      ? (user.englishName || user.name || user.realName || '')
      : (user.nickname || user.realName || user.name || '')

  const real = user.realName || ''

  if (!anonymous && !real) return '（未填）'
  if (!real) return anonymous
  if (!anonymous) return real
  if (anonymous === real) return real
  return `${anonymous}（${real}）`
}
