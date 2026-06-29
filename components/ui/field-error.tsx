/*
 * ----------------------------------------------
 * FieldError - 表單欄位錯誤訊息（i18n）
 * 2026-06-29
 * components/ui/field-error.tsx
 *
 * 接收 Zod/RHF 的錯誤訊息（為 validation.* i18n key），以當前語言翻譯呈現。
 * ----------------------------------------------
 */

'use client'

import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'

export function FieldError({ message, className }: { message?: string; className?: string }) {
  const t = useTranslations()
  if (!message) return null
  return <p className={cn('text-xs text-destructive', className)}>{t(message)}</p>
}
