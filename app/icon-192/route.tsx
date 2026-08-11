/*
 * ----------------------------------------------
 * PWA 圖示（192x192，動態產生）
 * 2026-08-11
 * app/icon-192/route.tsx
 * ----------------------------------------------
 */

import { ImageResponse } from 'next/og'
import { BrandIconMark } from '@/lib/pwa/brand-icon'

export const runtime = 'edge'

const SIZE = 192

export async function GET() {
  const response = new ImageResponse(<BrandIconMark size={SIZE} />, { width: SIZE, height: SIZE })
  response.headers.set('Cache-Control', 'public, max-age=31536000, immutable')
  return response
}
