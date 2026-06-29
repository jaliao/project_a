/*
 * ----------------------------------------------
 * API Route - 通訊 Email 驗證
 * 2026-03-23 (Updated: 2026-06-29)
 * app/api/verify-email/route.ts
 * ----------------------------------------------
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyCommEmail } from '@/app/actions/profile'

/**
 * 取得對外可達的 base URL。
 * 開發環境經 Cloudflare Tunnel 時，req.url 的 host 會是內部 localhost:3000，
 * 須改用轉發標頭（x-forwarded-host / x-forwarded-proto）還原真實對外網域，
 * 否則導向會落到瀏覽器無法到達的 localhost。
 */
function getPublicBaseUrl(req: NextRequest): string {
  const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host') ?? req.nextUrl.host
  const proto =
    req.headers.get('x-forwarded-proto') ?? req.nextUrl.protocol.replace(':', '') ?? 'https'
  return `${proto}://${host}`
}

export async function GET(req: NextRequest) {
  const base = getPublicBaseUrl(req)
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
