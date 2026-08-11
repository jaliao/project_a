/*
 * ----------------------------------------------
 * iOS 主畫面圖示（動態產生，Next.js 特殊檔案慣例，自動注入 <link rel="apple-touch-icon">）
 * 2026-08-11
 * app/apple-icon.tsx
 *
 * 不做圓角：iOS 加入主畫面時會自動套用系統遮罩/圓角，來源圖需滿版方形。
 * ----------------------------------------------
 */

import { ImageResponse } from 'next/og'
import { BrandIconMark } from '@/lib/pwa/brand-icon'

export const runtime = 'edge'
export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(<BrandIconMark size={size.width} rounded={false} />, size)
}
