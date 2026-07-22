/*
 * ----------------------------------------------
 * CourseContactAdminButton - 課程頁聯繫管理者按鈕
 * 2026-07-22
 * app/(user)/course/[id]/course-contact-admin-button.tsx
 *
 * 點擊開啟提問 Dialog，分類固定為「課程問題」並記錄課程關聯。
 * ----------------------------------------------
 */

'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { IconMessageCircle } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { ContactAdminDialog } from '@/components/support-inquiry/contact-admin-dialog'

type Props = {
  courseId: number
}

export function CourseContactAdminButton({ courseId }: Props) {
  const t = useTranslations('supportInquiry')
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)} className="w-fit gap-2">
        <IconMessageCircle className="h-4 w-4" />
        {t('dialogTitle')}
      </Button>
      <ContactAdminDialog open={open} onOpenChange={setOpen} fixedCategory="course" courseInviteId={courseId} />
    </>
  )
}
