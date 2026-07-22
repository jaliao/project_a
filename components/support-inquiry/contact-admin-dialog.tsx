/*
 * ----------------------------------------------
 * ContactAdminDialog - 聯絡管理者提問 Dialog（薄殼）
 * 2026-07-22 (Updated: 2026-07-22)
 * components/support-inquiry/contact-admin-dialog.tsx
 *
 * Dialog 外殼包住 SupportInquiryForm；表單邏輯見該檔案。
 * 供課程頁使用（固定分類＋課程關聯）。
 * ----------------------------------------------
 */

'use client'

import { useTranslations } from 'next-intl'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { SupportInquiryForm } from './support-inquiry-form'

type Category = 'account' | 'course' | 'material' | 'other'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  fixedCategory?: Category
  courseInviteId?: number
}

export function ContactAdminDialog({ open, onOpenChange, fixedCategory, courseInviteId }: Props) {
  const t = useTranslations('supportInquiry')

  function handleClose() {
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('dialogTitle')}</DialogTitle>
        </DialogHeader>

        <SupportInquiryForm
          fixedCategory={fixedCategory}
          courseInviteId={courseInviteId}
          onSuccess={handleClose}
          onCancel={handleClose}
        />
      </DialogContent>
    </Dialog>
  )
}
