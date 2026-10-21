/*
 * ----------------------------------------------
 * Route Handler - 世代倍增發展追蹤 raw data Excel 匯出
 * 2026-10-21
 * app/api/admin/dashboard/generations/export/route.ts
 * ----------------------------------------------
 */

import { NextRequest, NextResponse } from 'next/server'
import { generationTeacherDetails, taipeiMonthBounds } from '@/lib/data/monthly-report'
import { requireAdminSession, xlsxDownloadResponse } from '@/lib/utils/xlsx-export'

const MONTH_FORMAT = /^\d{4}-(0[1-9]|1[0-2])$/

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
  const authResult = await requireAdminSession()
  if (!authResult.ok) return authResult.response

  const month = req.nextUrl.searchParams.get('month') ?? ''
  if (!MONTH_FORMAT.test(month)) {
    return NextResponse.json({ error: 'Invalid month' }, { status: 400 })
  }
  const { end } = taipeiMonthBounds(month)

  const details = await generationTeacherDetails(end)

  const rows = details.map((d) => ({
    教師啟動編號姓名: d.teacherLabel,
    代別: d.generation,
    導師啟動編號姓名: d.mentorLabel ?? DASH,
    導師代別: d.mentorGeneration ?? DASH,
    最早帶出一人結業時間: formatDateTime(d.earliestGraduatedAt),
  }))

  const filename = `generations-${month}.xlsx`

  return xlsxDownloadResponse(rows, '世代明細', filename)
}
