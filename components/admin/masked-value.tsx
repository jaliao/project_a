/*
 * ----------------------------------------------
 * 後台機敏欄位遮蔽顯示（預設 ***、點擊切換檢視）
 * 2026-07-03
 * components/admin/masked-value.tsx
 * ----------------------------------------------
 */

'use client'

import { useState } from 'react'
import { IconEye, IconEyeOff } from '@tabler/icons-react'

/**
 * 機敏欄位（電話、Email）顯示層遮蔽：
 * - 預設顯示固定 `***`（不反映實際長度），點擊切換明文、再點恢復遮蔽
 * - 空值直接顯示 `—`，無切換互動
 * - 僅為旁窺防護，明文仍隨頁面 payload 送達（管理者本有權檢視）
 */
export function MaskedValue({ value, label }: { value: string | null | undefined; label: string }) {
  const [revealed, setRevealed] = useState(false)

  if (!value) return <span>—</span>

  // 明文狀態下拖曳選取文字放開時也會觸發 click——有選取內容時不切換，確保可複製
  const toggle = () => {
    if (revealed && window.getSelection()?.toString()) return
    setRevealed((v) => !v)
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={revealed ? `隱藏${label}` : `顯示${label}`}
      className="inline-flex items-center gap-1.5 text-left hover:opacity-70"
    >
      <span className={revealed ? 'select-text' : undefined}>{revealed ? value : '***'}</span>
      {revealed
        ? <IconEyeOff className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        : <IconEye className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
    </button>
  )
}
