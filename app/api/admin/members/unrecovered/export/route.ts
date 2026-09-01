/*
 * ----------------------------------------------
 * Route Handler - 未找回帳號名冊 Excel 匯出
 * 2026-09-01
 * app/api/admin/members/unrecovered/export/route.ts
 *
 * 匯出登入 Email 仍為 seed 合成網域 @seed.iwillshare.org.tw 的會員
 * （尚未完成「找回帳號」流程、登入信箱未被替換者）。範圍固定、不吃 query 參數。
 * ----------------------------------------------
 */

import { NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import { auth } from '@/lib/auth'
import { canAccessAdmin, TEACHER_ROLES } from '@/lib/auth-roles'
import { exportUnrecoveredSeedMembers } from '@/lib/data/members'

// 性別中文化（規則同 app/api/admin/members/export/route.ts）
function formatGender(gender: string | null | undefined): string {
  if (gender === 'male') return '男'
  if (gender === 'female') return '女'
  return '未指定'
}

// 所屬教會組合（規則同 app/api/admin/members/export/route.ts）
function formatChurch(
  churchName: string | null | undefined,
  churchOther: string | null | undefined,
  churchType: string | null | undefined
): string {
  return churchName ?? churchOther ?? churchType ?? ''
}

export async function GET() {
  // 驗證 session + admin role（middleware 已擋未登入，這裡再確認身分）
  const session = await auth()
  if (!session?.user || !canAccessAdmin(session.user.roles)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const members = await exportUnrecoveredSeedMembers()

  // 組成 xlsx 資料列（8 欄）
  const rows = members.map((m) => {
    const isTeacher = TEACHER_ROLES.some((r) => m.roles.includes(r))
    return {
      啟動編號: m.spiritId ?? '',
      真實姓名: m.realName ?? '',
      Email: m.email ?? '',
      性別: formatGender(m.gender),
      所屬教會: formatChurch(m.church?.name, m.churchOther, m.churchType),
      授課老師: m.teacherNames.join('、'),
      身分別: isTeacher ? '講師' : '學員',
      講師編號: isTeacher ? (m.teacherNo ?? '') : '',
    }
  })

  // 生成 xlsx Buffer
  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '未找回帳號')
  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

  // 檔名含日期
  const dateStr = new Date().toISOString().slice(0, 10)
  const filename = `unrecovered-members-${dateStr}.xlsx`

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
