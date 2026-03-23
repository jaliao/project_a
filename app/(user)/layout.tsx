/*
 * ----------------------------------------------
 * (user) Layout - 已登入使用者共用佈局
 * 2026-03-23
 * app/(user)/layout.tsx
 * ----------------------------------------------
 */

import { Topbar } from '@/components/layout/topbar'

export default function UserLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <Topbar />
      <main className="flex-1 p-6">
        {children}
      </main>
    </div>
  )
}
