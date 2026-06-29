/*
 * ----------------------------------------------
 * PrintButton - 列印觸發按鈕
 * 2026-03-30
 * app/(user)/admin/materials/[id]/print/print-button.tsx
 * ----------------------------------------------
 */

'use client'

import { Button } from '@/components/ui/button'

export function PrintButton() {
  return (
    <Button size="sm" onClick={() => window.print()}>
      列印
    </Button>
  )
}
