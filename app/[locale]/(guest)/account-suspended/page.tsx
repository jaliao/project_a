/*
 * ----------------------------------------------
 * 帳號已暫停頁（獨立公開頁）
 * 2026-06-22
 * app/account-suspended/page.tsx
 *
 * 被暫停帳號的封鎖落點。純靜態提示，不讀 session、不做 client auth 呼叫，
 * 「重新登入」為一般連結（整頁導覽）至 /login，確保登入頁以乾淨狀態載入。
 * ----------------------------------------------
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'

export const metadata: Metadata = {
  title: '帳號已暫停 — 啟動事工',
}

export default function AccountSuspendedPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm space-y-6 text-center">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">此帳號已被暫停</h1>
          <p className="text-sm text-muted-foreground">
            您的帳號目前無法登入，請聯繫管理員以了解詳情或恢復帳號。
          </p>
        </div>
        <Link href="/login" className={cn(buttonVariants(), 'w-full')}>
          重新登入
        </Link>
      </div>
    </div>
  )
}
