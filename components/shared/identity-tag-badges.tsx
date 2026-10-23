/*
 * ----------------------------------------------
 * 身分標籤渲染元件
 * 2026-10-23
 * components/shared/identity-tag-badges.tsx
 *
 * 單一渲染元件：以一致樣式呈現 getIdentityTags() 計算出的標籤陣列，
 * 取代各頁面各自手刻 Badge（CR-REFACTOR-261023-001）。
 * ----------------------------------------------
 */
import { Badge } from '@/components/ui/badge'

export function IdentityTagBadges({ tags }: { tags: string[] }) {
  if (tags.length === 0) return null
  return (
    <div className="flex flex-wrap gap-1.5">
      {tags.map((tag) => (
        <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
      ))}
    </div>
  )
}
