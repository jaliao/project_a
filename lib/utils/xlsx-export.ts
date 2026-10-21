/*
 * ----------------------------------------------
 * Utility - 後台 Excel 匯出共用 helper
 * 2026-10-21
 * lib/utils/xlsx-export.ts
 * ----------------------------------------------
 */

import { NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import type { Session } from 'next-auth'
import { auth } from '@/lib/auth'
import { canAccessAdmin } from '@/lib/auth-roles'

export async function requireAdminSession(): Promise<
  | { ok: true; session: Session }
  | { ok: false; response: NextResponse }
> {
  const session = await auth()
  if (!session?.user || !canAccessAdmin(session.user.roles)) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    }
  }
  return { ok: true, session }
}

export function xlsxDownloadResponse(
  rows: Record<string, unknown>[],
  sheetName: string,
  filename: string,
): NextResponse {
  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, sheetName)
  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

  return new NextResponse(buffer, {
    headers: {
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
