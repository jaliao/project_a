/*
 * ----------------------------------------------
 * 瀏覽器 Favicon（動態產生，Next.js 特殊檔案慣例，自動注入 <link rel="icon">）
 * 2026-08-11
 * app/icon.tsx
 * ----------------------------------------------
 */

import { ImageResponse } from 'next/og'
import { BrandIconMark } from '@/lib/pwa/brand-icon'

export const runtime = 'edge'
export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(<BrandIconMark size={size.width} />, size)
}
