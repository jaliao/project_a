/*
 * ----------------------------------------------
 * Route Handler - 會員資料 Excel 匯出
 * 2026-04-08
 * app/api/admin/members/export/route.ts
 * ----------------------------------------------
 */

import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import { auth } from '@/lib/auth'
import { canAccessAdmin, ROLE_LABELS } from '@/lib/auth-roles'
import type { UserRole } from '@prisma/client'
import { exportMembers } from '@/lib/data/members'

// 性別中文化
function formatGender(gender: string | null | undefined): string {
  if (gender === 'male') return '男'
  if (gender === 'female') return '女'
  return '未指定'
}

// 身分中文化（輸出所有身分，以頓號分隔）
function formatRoles(roles: UserRole[]): string {
  return roles.map((r) => ROLE_LABELS[r] ?? r).join('、')
}

// 所屬教會組合
function formatChurch(
  churchName: string | null | undefined,
  churchOther: string | null | undefined,
  churchType: string | null | undefined
): string {
  return churchName ?? churchOther ?? churchType ?? ''
}

// 日期格式化 YYYY/MM/DD
function formatDate(date: Date | null | undefined): string {
  if (!date) return ''
  return date.toISOString().slice(0, 10).replace(/-/g, '/')
}

export async function GET(req: NextRequest) {
  // 驗證 session + admin role
  const session = await auth()
  if (!session?.user || !canAccessAdmin(session.user.roles)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 讀取搜尋與篩選條件
  const sp = req.nextUrl.searchParams
  const members = await exportMembers({
    q: sp.get('q') ?? undefined,
    gender: (sp.get('gender') as 'male' | 'female' | 'unspecified' | null) ?? undefined,
    role:
      (sp.get('role') as
        | 'user'
        | 'teacher_1'
        | 'teacher_2'
        | 'teacher_3'
        | 'admin'
        | 'superadmin'
        | null) ?? undefined,
    church: sp.get('church') ?? undefined,
  })

  // 組成 xlsx 資料列
  const rows = members.map((m) => ({
    啟動編號: m.spiritId ?? '',
    真實姓名: m.realName ?? '',
    英文名稱: m.englishName ?? '',
    暱稱: m.nickname ?? '',
    Email: m.email ?? '',
    通訊Email: m.commEmail ?? '',
    手機: m.phone ?? '',
    性別: formatGender(m.gender),
    身分: formatRoles(m.roles),
    授課老師編號: m.teacherNo ?? '',
    所屬教會: formatChurch(m.church?.name, m.churchOther, m.churchType),
    學習等級: m.learningLevel,
    加入日期: formatDate(m.createdAt),
    最後登入: formatDate(m.lastLoginAt),
    上次登入: formatDate(m.previousLoginAt),
    已完成首次登入: m.lastLoginAt ? '是' : '否',
    已完成首次補填: m.realName && m.phone ? '是' : '否',
    已更改臨時密碼: !m.hasPassword ? '不適用' : m.isTempPassword ? '否' : '是',
  }))

  // 生成 xlsx Buffer
  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '會員清單')
  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

  // 檔名含日期
  const dateStr = new Date().toISOString().slice(0, 10)
  const filename = `members-${dateStr}.xlsx`

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
