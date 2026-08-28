/*
 * ----------------------------------------------
 * 後台「會員首頁」快捷按鈕
 * 2026-08-28
 * components/admin/member-home-link.tsx
 * ----------------------------------------------
 * 於後台會員／講師清單與詳情頁，提供一鍵切換到該會員前台個人首頁
 * （/user/<spiritId 小寫>）的入口，於新分頁開啟以保留目前搜尋／篩選狀態。
 */

import Link from 'next/link'
import { Button } from '@/components/ui/button'

type Props = {
  /** 會員啟動編號（DB 存大寫）；為 null／空字串時按鈕停用 */
  spiritId: string | null
  size?: 'sm' | 'default'
  variant?: 'ghost' | 'outline'
}

export function MemberHomeLink({ spiritId, size = 'sm', variant = 'ghost' }: Props) {
  if (!spiritId) {
    return (
      <Button variant={variant} size={size} disabled title="此會員尚無啟動編號">
        會員首頁
      </Button>
    )
  }

  return (
    <Button variant={variant} size={size} asChild>
      <Link href={`/user/${spiritId.toLowerCase()}`} target="_blank" rel="noopener noreferrer">
        會員首頁
      </Link>
    </Button>
  )
}
