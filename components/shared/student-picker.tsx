/*
 * ----------------------------------------------
 * StudentPicker - 通用單選學員選擇元件
 * 2026-09-16
 * components/shared/student-picker.tsx
 *
 * cr-spec-260916-004：未輸入關鍵字時顯示呼叫端傳入的社群好友清單可直接點選；
 * 輸入關鍵字（debounce）後改呼叫端傳入的 onSearch 模糊搜尋既有會員（結果已由
 * 呼叫端排序好友優先）。元件本身不含任何授權/資料範圍邏輯，純展示＋回呼，
 * 單選：點選任一候選人即回傳並結束選取。
 * ----------------------------------------------
 */

'use client'

import { useMemo, useRef, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { UserAvatar } from '@/components/shared/user-avatar'
import type { FriendListItem } from '@/lib/data/friendship'
import type { StudentPickerCandidate } from '@/lib/data/student-picker'

type SearchResult = {
  success: boolean
  message?: string
  data?: { candidates: StudentPickerCandidate[] }
}

export type StudentPickerSelection = {
  userId: string
  spiritId: string | null
  displayName: string
  avatarUrl: string | null
  isFriend: boolean
}

type PickerItem = StudentPickerSelection

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  friends: FriendListItem[]
  onSearch: (query: string) => Promise<SearchResult>
  excludeUserIds?: string[]
  onSelect: (student: PickerItem) => void
  title?: string
  description?: string
}

export function StudentPicker({
  open,
  onOpenChange,
  friends,
  onSearch,
  excludeUserIds,
  onSelect,
  title = '選擇學員',
  description = '輸入啟動編號、姓名、暱稱或 Email 搜尋，或直接點選社群好友',
}: Props) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<StudentPickerCandidate[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const seq = useRef(0)
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const excludeSet = useMemo(() => new Set(excludeUserIds ?? []), [excludeUserIds])

  const friendItems = useMemo<PickerItem[]>(
    () =>
      friends
        .filter((f) => !excludeSet.has(f.userId))
        .map((f) => ({
          userId: f.userId,
          spiritId: f.spiritId,
          displayName: f.displayName,
          avatarUrl: f.avatarUrl,
          isFriend: true,
        })),
    [friends, excludeSet]
  )

  // 關鍵字變動時（debounce 300ms）觸發搜尋；空字串回到好友清單畫面
  // 以 onChange 直接排程（非 useEffect），setState 皆發生於 debounce/搜尋 callback 內
  const handleQueryChange = (value: string) => {
    setQuery(value)
    if (debounceTimer.current) clearTimeout(debounceTimer.current)

    const trimmed = value.trim()
    const current = ++seq.current
    if (!trimmed) {
      setResults(null)
      setLoading(false)
      setError(null)
      return
    }
    setLoading(true)
    setError(null)
    debounceTimer.current = setTimeout(async () => {
      const res = await onSearch(trimmed)
      if (current !== seq.current) return // 過期查詢結果丟棄
      setLoading(false)
      if (res.success) {
        setResults(res.data?.candidates ?? [])
      } else {
        setResults([])
        setError(res.message ?? '搜尋失敗，請稍後再試')
      }
    }, 300)
  }

  const handleOpenChange = (next: boolean) => {
    onOpenChange(next)
    if (!next) {
      if (debounceTimer.current) clearTimeout(debounceTimer.current)
      setQuery('')
      setResults(null)
      setError(null)
    }
  }

  const handleSelect = (item: PickerItem) => {
    onSelect(item)
    handleOpenChange(false)
  }

  const showingSearch = query.trim().length > 0
  const searchItems: PickerItem[] | null = results
    ? results.map((c) => ({
        userId: c.userId,
        spiritId: c.spiritId,
        displayName: c.displayName,
        avatarUrl: c.avatarUrl,
        isFriend: c.isFriend,
      }))
    : null

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Input
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            placeholder="啟動編號、姓名、暱稱或 Email"
          />
          <div className="max-h-72 space-y-1 overflow-y-auto">
            {!showingSearch ? (
              friendItems.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">尚無社群好友</p>
              ) : (
                friendItems.map((item) => (
                  <PickerRow key={item.userId} item={item} onClick={() => handleSelect(item)} />
                ))
              )
            ) : loading ? (
              <p className="py-4 text-center text-sm text-muted-foreground">搜尋中…</p>
            ) : error ? (
              <p className="py-4 text-center text-sm text-destructive">{error}</p>
            ) : searchItems && searchItems.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">查無符合的會員</p>
            ) : (
              searchItems?.map((item) => (
                <PickerRow key={item.userId} item={item} onClick={() => handleSelect(item)} />
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function PickerRow({ item, onClick }: { item: PickerItem; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-2 rounded-md p-2 text-left hover:bg-muted/60"
    >
      <UserAvatar avatarUrl={item.avatarUrl} displayName={item.displayName} size="sm" />
      <span className="truncate text-sm">{item.displayName}</span>
      {item.isFriend && (
        <span className="ml-auto shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
          好友
        </span>
      )}
    </button>
  )
}
