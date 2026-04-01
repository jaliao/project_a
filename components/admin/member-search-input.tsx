/*
 * ----------------------------------------------
 * 會員搜尋輸入框
 * 2026-04-01
 * components/admin/member-search-input.tsx
 * ----------------------------------------------
 */

'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Input } from '@/components/ui/input'

export function MemberSearchInput() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [value, setValue] = useState(searchParams.get('q') ?? '')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const updateUrl = useCallback(
    (q: string) => {
      const params = new URLSearchParams()
      if (q) params.set('q', q)
      router.push(`${pathname}${params.size ? `?${params.toString()}` : ''}`)
    },
    [router, pathname]
  )

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value
    setValue(q)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => updateUrl(q), 300)
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  return (
    <Input
      type="search"
      placeholder="搜尋姓名、暱稱或 Email…"
      value={value}
      onChange={handleChange}
      className="max-w-sm"
    />
  )
}
