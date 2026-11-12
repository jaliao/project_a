/*
 * ----------------------------------------------
 * Route Handler - 世代倍增發展追蹤 raw data Excel 匯出
 * 2026-10-21
 * app/api/admin/dashboard/generations/export/route.ts
 * ----------------------------------------------
 */

import { NextRequest, NextResponse } from 'next/server'
import { generationHierarchyRows, taipeiMonthBounds } from '@/lib/data/monthly-report'
import { requireAdminSession, xlsxAoaDownloadResponse } from '@/lib/utils/xlsx-export'

const MONTH_FORMAT = /^\d{4}-(0[1-9]|1[0-2])$/

export async function GET(req: NextRequest) {
  const authResult = await requireAdminSession()
  if (!authResult.ok) return authResult.response

  const month = req.nextUrl.searchParams.get('month') ?? ''
  if (!MONTH_FORMAT.test(month)) {
    return NextResponse.json({ error: 'Invalid month' }, { status: 400 })
  }
  const { end } = taipeiMonthBounds(month)

  const rows = await generationHierarchyRows(end)

  const maxDepth = rows.reduce((max, r) => Math.max(max, r.depth), 0)
  const genCols = Array.from({ length: maxDepth + 1 }, (_, i) => `第${i}代`)
  const header = [...genCols, '直屬下線人數']

  const aoa: unknown[][] = [header]
  for (const row of rows) {
    const line = new Array(header.length).fill('')
    line[row.depth] = row.label
    if (row.directChildCount > 0) line[header.length - 1] = row.directChildCount
    aoa.push(line)
  }

  const filename = `generations-${month}.xlsx`

  return xlsxAoaDownloadResponse(aoa, '世代階層', filename)
}
