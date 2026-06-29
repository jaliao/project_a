/*
 * ----------------------------------------------
 * API Route - 通訊 Email 驗證
 * 2026-03-23 (Updated: 2026-06-29)
 * app/api/verify-email/route.ts
 * ----------------------------------------------
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyCommEmail } from '@/app/actions/profile'
import { getRequestBaseUrl } from '@/lib/utils/app-url'

export async function GET(req: NextRequest) {
  const base = getRequestBaseUrl(req)
  const token = req.nextUrl.searchParams.get('token')

  if (!token) {
    return NextResponse.redirect(new URL('/profile?error=invalid_token', base))
  }

  const result = await verifyCommEmail(token)

  if (result.success) {
    return NextResponse.redirect(new URL('/profile?verified=1', base))
  }

  return NextResponse.redirect(new URL('/profile?error=token_expired', base))
}
