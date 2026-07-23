/*
 * ----------------------------------------------
 * ContactAdminCards - 個人頁「聯繫管理者」卡片區塊
 * 2026-07-23
 * components/support-inquiry/contact-admin-cards.tsx
 *
 * 最近提問卡片（最多 2 張）＋ 固定 1 張填寫新提問表單卡片
 * ----------------------------------------------
 */

import { InquiryCard } from '@/components/support-inquiry/inquiry-card'
import { SupportInquiryForm } from '@/components/support-inquiry/support-inquiry-form'
import type { MyInquiryItem } from '@/lib/data/support-inquiry'

export function ContactAdminCards({ inquiries }: { inquiries: MyInquiryItem[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {inquiries.map((inq) => (
        <div key={inq.id} className="rounded-lg border p-4">
          <InquiryCard inquiry={inq} />
        </div>
      ))}
      <div className="rounded-lg border p-4">
        <SupportInquiryForm />
      </div>
    </div>
  )
}
