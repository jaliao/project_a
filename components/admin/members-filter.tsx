/*
 * ----------------------------------------------
 * 會員管理篩選列（搜尋 + 性別/身分/教會下拉）
 * 2026-06-12
 * components/admin/members-filter.tsx
 * ----------------------------------------------
 */

'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/input'

type ChurchOption = { id: number; name: string }

const GENDER_OPTIONS = [
  { value: '', label: '全部性別' },
  { value: 'male', label: '男' },
  { value: 'female', label: '女' },
  { value: 'unspecified', label: '未指定' },
]

const ROLE_OPTIONS = [
  { value: '', label: '全部身分' },
  { value: 'user', label: '一般會員' },
  { value: 'teacher_1', label: '啟動靈人講師' },
  { value: 'teacher_2', label: '啟動豐盛講師' },
  { value: 'teacher_3', label: '啟動得勝講師' },
  { value: 'teacher_4', label: '啟動事工 4 講師' },
  { value: 'admin', label: '管理者' },
  { value: 'superadmin', label: '超級管理者' },
]

const SELECT_CLASS =
  'h-9 rounded-md border border-input bg-background px-3 py-1 text-sm'

export function MembersFilter({ churches }: { churches: ChurchOption[] }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [q, setQ] = useState(searchParams.get('q') ?? '')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // 更新 URL：套用變更、移除 page（重置第 1 頁）、空值移除參數
  const push = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString())
      for (const [k, v] of Object.entries(updates)) {
        if (v) params.set(k, v)
        else params.delete(k)
      }
      params.delete('page')
      router.push(`${pathname}${params.size ? `?${params.toString()}` : ''}`)
    },
    [router, pathname, searchParams]
  )

  const handleQChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value
    setQ(v)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => push({ q: v }), 300)
  }

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

  return (
    <div className="flex flex-wrap items-end gap-3">
      <Input
        type="search"
        placeholder="搜尋姓名、暱稱、Email、啟動編號…"
        value={q}
        onChange={handleQChange}
        className="max-w-xs flex-1 min-w-48"
      />

      <select className={SELECT_CLASS} defaultValue={searchParams.get('gender') ?? ''} onChange={(e) => push({ gender: e.target.value })}>
        {GENDER_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>

      <select className={SELECT_CLASS} defaultValue={searchParams.get('role') ?? ''} onChange={(e) => push({ role: e.target.value })}>
        {ROLE_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>

      <select className={SELECT_CLASS} defaultValue={searchParams.get('church') ?? ''} onChange={(e) => push({ church: e.target.value })}>
        <option value="">全部教會</option>
        {churches.map((c) => (
          <option key={c.id} value={String(c.id)}>{c.name}</option>
        ))}
        <option value="other">其他</option>
        <option value="none">無</option>
      </select>
    </div>
  )
}
