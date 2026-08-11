/*
 * ----------------------------------------------
 * PWA 圖示（512x512，動態產生；同時作為 maskable 圖示來源）
 * 2026-08-11
 * app/icon-512/route.tsx
 * ----------------------------------------------
 */

import { ImageResponse } from 'next/og'
import { BrandIconMark } from '@/lib/pwa/brand-icon'

export const runtime = 'edge'

const SIZE = 512

export async function GET() {
  const response = new ImageResponse(<BrandIconMark size={SIZE} />, { width: SIZE, height: SIZE })
  response.headers.set('Cache-Control', 'public, max-age=31536000, immutable')
  return response
}
