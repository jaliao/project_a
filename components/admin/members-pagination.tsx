/*
 * ----------------------------------------------
 * 會員管理翻頁控制（上一頁／下一頁）
 * 2026-06-12
 * components/admin/members-pagination.tsx
 * ----------------------------------------------
 */

'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'

export function MembersPagination({ page, pageCount }: { page: number; pageCount: number }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const goto = (p: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', String(p))
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="flex items-center justify-center gap-3 py-2 text-sm">
      <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => goto(page - 1)}>
        上一頁
      </Button>
      <span className="text-muted-foreground">第 {page} / {pageCount} 頁</span>
      <Button variant="outline" size="sm" disabled={page >= pageCount} onClick={() => goto(page + 1)}>
        下一頁
      </Button>
    </div>
  )
}
