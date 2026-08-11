/*
 * ----------------------------------------------
 * PWA Web App Manifest
 * 2026-08-11
 * app/manifest.ts
 * ----------------------------------------------
 */

import type { MetadataRoute } from 'next'

// 對應 app/globals.css 的 --primary（light）/--background（light），manifest.json 不支援 CSS 變數，需手動同步 hex 值
const THEME_COLOR = '#2563eb'
const BACKGROUND_COLOR = '#ffffff'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: '啟動事工',
    short_name: '啟動事工',
    description: '啟動事工 — 課程管理、會員管理與學習追蹤平台',
    start_url: '/',
    display: 'standalone',
    theme_color: THEME_COLOR,
    background_color: BACKGROUND_COLOR,
    icons: [
      { src: '/icon-192', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon-512', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
