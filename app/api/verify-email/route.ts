/*
 * ----------------------------------------------
 * API Route - 通訊 Email 驗證
 * 2026-03-23
 * app/api/verify-email/route.ts
 * ----------------------------------------------
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyCommEmail } from '@/app/actions/profile'

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')

  if (!token) {
    return NextResponse.redirect(new URL('/profile?error=invalid_token', req.url))
  }

  const result = await verifyCommEmail(token)

  if (result.success) {
    return NextResponse.redirect(new URL('/profile?verified=1', req.url))
  }

  return NextResponse.redirect(new URL('/profile?error=token_expired', req.url))
}
