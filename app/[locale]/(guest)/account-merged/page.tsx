/*
 * ----------------------------------------------
 * 帳號已合併頁（獨立公開頁）
 * 2026-10-16
 * app/(guest)/account-merged/page.tsx
 *
 * 已被標記為副帳號（mergedIntoId 非 null）帳號的封鎖落點。純靜態提示，
 * 不讀 session、不做 client auth 呼叫，「重新登入」為一般連結（整頁導覽）
 * 至 /login，確保登入頁以乾淨狀態載入。比照 /account-suspended 的做法。
 * ----------------------------------------------
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'pageMeta' })
  return { title: t('accountMerged') }
}

export default function AccountMergedPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm space-y-6 text-center">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">此帳號已併入其他帳號</h1>
          <p className="text-sm text-muted-foreground">
            您的帳號已與另一組帳號合併，請改用該帳號登入。如有疑問請聯繫管理員。
          </p>
        </div>
        <Link href="/login" className={cn(buttonVariants(), 'w-full')}>
          重新登入
        </Link>
      </div>
    </div>
  )
}
