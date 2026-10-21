/*
 * ----------------------------------------------
 * Route Handler - 世代倍增發展追蹤 raw data Excel 匯出
 * 2026-10-21
 * app/api/admin/dashboard/generations/export/route.ts
 * ----------------------------------------------
 */

import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import { auth } from '@/lib/auth'
import { canAccessAdmin } from '@/lib/auth-roles'
import {
  generationTeacherDetails,
  getAvailableReportMonths,
  normalizeMonth,
  taipeiMonthBounds,
} from '@/lib/data/monthly-report'

const DASH = '—'
const REPORT_TZ = 'Asia/Taipei'

function formatDateTime(date: Date): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: REPORT_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date)
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? ''
  return `${get('year')}-${get('month')}-${get('day')} ${get('hour')}:${get('minute')}:${get('second')}`
}

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user || !canAccessAdmin(session.user.roles)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const available = await getAvailableReportMonths()
  const month = normalizeMonth(
    req.nextUrl.searchParams.get('month') ?? undefined,
    available.map((m) => m.value),
  )
  const { end } = taipeiMonthBounds(month)

  const details = await generationTeacherDetails(end)

  const rows = details.map((d) => ({
    教師啟動編號姓名: d.teacherLabel,
    代別: d.generation,
    導師啟動編號姓名: d.mentorLabel ?? DASH,
    導師代別: d.mentorGeneration ?? DASH,
    最早帶出一人結業時間: formatDateTime(d.earliestGraduatedAt),
  }))

  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '世代明細')
  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

  const filename = `generations-${month}.xlsx`

  return new NextResponse(buffer, {
    headers: {
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
