/*
 * ----------------------------------------------
 * BrandLogo - 全站共用品牌標記（藍底白「A」＋系統名）
 * 2026-09-02
 * components/layout/brand-logo.tsx
 *
 * cr-spec-260902-002：全站品牌 A 標記共用元件。沿用 lib/pwa/brand-icon.tsx 的
 * BrandIconMark（與 favicon／PWA icon 同源），供 Topbar、公開頁 Header、Footer 共用。
 * 純呈現：是否可點、連往何處由呼叫端自行包 <Link>／<button>。
 * ----------------------------------------------
 */

'use client'

import { useTranslations } from 'next-intl'
import { BrandIconMark } from '@/lib/pwa/brand-icon'
import { cn } from '@/lib/utils'

type Props = {
  /** icon 邊長 px，預設 24 */
  size?: number
  /** 只顯示 A 標記、不顯示文字 */
  iconOnly?: boolean
  className?: string
  textClassName?: string
}

export function BrandLogo({ size = 24, iconOnly = false, className, textClassName }: Props) {
  const t = useTranslations('common')
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <span className="inline-flex shrink-0" style={{ width: size, height: size }}>
        <BrandIconMark size={size} />
      </span>
      {!iconOnly && (
        <span className={cn('truncate font-semibold', textClassName)}>{t('appName')}</span>
      )}
    </span>
  )
}
