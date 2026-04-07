/*
 * ----------------------------------------------
 * CourseCatalogBadge - 課程目錄等級標籤共用元件
 * 2026-04-07
 * components/course-session/course-catalog-badge.tsx
 * ----------------------------------------------
 */

import { cn } from '@/lib/utils'

// 課程目錄 id 循環色彩（id 1 → 藍，2 → 綠，3 → 紫，4 → 橘，以此類推）
const CATALOG_COLORS = [
  'bg-blue-100 text-blue-700',
  'bg-green-100 text-green-700',
  'bg-purple-100 text-purple-700',
  'bg-orange-100 text-orange-700',
  'bg-pink-100 text-pink-700',
  'bg-teal-100 text-teal-700',
]

export function getCatalogColor(id: number): string {
  return CATALOG_COLORS[(id - 1) % CATALOG_COLORS.length]
}

type Props = {
  catalogId: number
  label: string
  size?: 'sm' | 'md'
  className?: string
}

export function CourseCatalogBadge({ catalogId, label, size = 'md', className }: Props) {
  return (
    <span
      className={cn(
        'rounded-full font-medium',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-0.5 text-xs',
        getCatalogColor(catalogId),
        className
      )}
    >
      {label}
    </span>
  )
}
