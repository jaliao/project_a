/*
 * ----------------------------------------------
 * 後台活動紀錄規則說明頁
 * 2026-08-28
 * app/[locale]/(admin)/admin/activity-logs/rules/page.tsx
 * ----------------------------------------------
 */

export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import Link from 'next/link'
import { IconArrowLeft } from '@tabler/icons-react'
import { ADMIN_LOG_ACTIONS } from '@/config/admin-log-action'

export const metadata: Metadata = {
  title: '活動紀錄規則說明 — 啟動事工',
}

export default function ActivityLogRulesPage() {
  // 守衛（登入 + admin）由 (admin)/layout.tsx 統一處理
  const actions = Object.entries(ADMIN_LOG_ACTIONS)

  return (
    <div className="space-y-6">
      <Link
        href="/admin/activity-logs"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <IconArrowLeft className="h-4 w-4" />
        返回系統活動紀錄
      </Link>

      <h1 className="text-2xl font-semibold">活動紀錄規則說明</h1>

      <p className="text-sm text-muted-foreground">
        以下列出目前會被寫入系統活動紀錄（<code>admin_action_logs</code>）的操作類型與其觸發條件。
      </p>

      <div className="space-y-3">
        {actions.map(([code, { label, trigger }]) => (
          <div key={code} className="space-y-1 rounded-lg border p-4">
            <div className="flex flex-wrap items-baseline gap-2">
              <span className="font-medium">{label}</span>
              <code className="text-xs text-muted-foreground">{code}</code>
            </div>
            <p className="text-sm text-muted-foreground">{trigger}</p>
          </div>
        ))}
      </div>

      <div className="space-y-2 rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
        <p className="font-medium text-foreground">通則</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>每筆紀錄以「文字快照」保存操作者、對象與班級資訊，不依賴關聯查詢。</li>
          <li>對象會員或班級日後即使被刪除，紀錄仍完整保留且可讀。</li>
          <li>清單頁每頁顯示 30 筆，最新的紀錄排在最前面。</li>
          <li>操作若在資料庫交易中失敗並回滾，不會留下紀錄。</li>
        </ul>
      </div>
    </div>
  )
}
