/*
 * ----------------------------------------------
 * CourseOperationLog - 課程操作 LOG 區塊（Server Component）
 * 2026-07-14
 * app/[locale]/(user)/course/[id]/course-operation-log.tsx
 *
 * 顯示該課程的管理操作紀錄（學員新增/移除），最新在前、最多 30 筆；
 * 僅管理者與該課講師可見（由 page 控制渲染）。內容以快照欄呈現。
 * ----------------------------------------------
 */

import { IconClipboardList } from '@tabler/icons-react'
import { getAdminLogs } from '@/lib/data/admin-logs'
import { getAdminLogActionLabel } from '@/config/admin-log-action'
import { Badge } from '@/components/ui/badge'

function fmtDateTime(d: Date): string {
  return new Date(d).toLocaleString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export async function CourseOperationLog({ inviteId }: { inviteId: number }) {
  const result = await getAdminLogs({ inviteId, page: 1 })

  return (
    <div className="rounded-lg border p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <IconClipboardList className="h-5 w-5 text-primary" />
          <h2 className="text-base font-semibold">課程操作 LOG</h2>
        </div>
        <span className="text-xs text-muted-foreground">顯示最近 30 筆・共 {result.total} 筆</span>
      </div>

      {result.items.length === 0 ? (
        <p className="text-sm text-muted-foreground">尚無操作紀錄</p>
      ) : (
        <div className="space-y-3">
          {result.items.map((log) => (
            <div key={log.id} className="space-y-1.5 rounded-lg border p-3 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={
                      log.action === 'enrollment_remove'
                        ? 'border-red-200 text-red-700'
                        : 'border-green-200 text-green-700'
                    }
                  >
                    {getAdminLogActionLabel(log.action)}
                  </Badge>
                  <span className="text-muted-foreground">{fmtDateTime(log.createdAt)}</span>
                </div>
                <span className="text-muted-foreground">操作者：{log.actorName}</span>
              </div>
              <p className="break-words">
                <span className="text-muted-foreground">對象：</span>
                {log.targetName}
              </p>
              {log.detail && <p className="break-words text-muted-foreground">{log.detail}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
