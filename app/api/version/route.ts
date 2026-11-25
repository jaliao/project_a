/*
 * ----------------------------------------------
 * API Route - 版本查詢
 * 2026-11-25
 * app/api/version/route.ts
 *
 * 回傳目前部署的版本號與更新日期，供跨環境版本比對工具
 * （~/.claude/skills/bc-version）curl 查詢，免登入即可存取。
 * ----------------------------------------------
 */

import { NextResponse } from 'next/server'
import versionInfo from '@/config/version.json'

export async function GET() {
  return NextResponse.json({
    version: versionInfo.version,
    updatedAt: versionInfo.updatedAt,
  })
}
