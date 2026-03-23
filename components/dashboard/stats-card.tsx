/*
 * ----------------------------------------------
 * StatsCard - 統計卡片元件
 * 2026-03-23
 * components/dashboard/stats-card.tsx
 * ----------------------------------------------
 */

import type { ReactNode } from 'react'

interface StatsCardProps {
  icon: ReactNode
  value: number | string
  title: string
}

export function StatsCard({ icon, value, title }: StatsCardProps) {
  return (
    <div className="rounded-lg border bg-card p-6 flex items-center gap-4">
      <div className="flex h-12 w-12 items-center justify-center rounded-md bg-muted text-muted-foreground">
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-sm text-muted-foreground">{title}</p>
      </div>
    </div>
  )
}
