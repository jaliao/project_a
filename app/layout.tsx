/*
 * ----------------------------------------------
 * Root Layout
 * 2026-03-23
 * app/layout.tsx
 * ----------------------------------------------
 */

import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from 'sonner'

export const metadata: Metadata = {
  title: '啟動事工',
  description: '啟動事工 - 會員管理系統',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-TW">
      <body>
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  )
}
