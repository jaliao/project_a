/*
 * ----------------------------------------------
 * 後台疑似重複帳號清單
 * 2026-10-16 (Updated: 2026-10-16)
 * app/(admin)/admin/members/duplicates/page.tsx
 *
 * 列出 realName 完全相同且至少命中一項輔助訊號的帳號配對，依信心等級分級呈現。
 * 本頁 server component 僅做純查詢，不包含任何 Server Action 呼叫；
 * 每組候選的「合併這兩筆帳號」連結由 client 子元件 DuplicateCandidateRow
 * 掛載 MemberMergeDialog 處理（cr-feat-261016-003）。
 * ----------------------------------------------
 */

import type { Metadata } from 'next'
import { findDuplicateCandidates } from '@/lib/data/duplicate-accounts'
import { DuplicateCandidateRow } from '@/components/admin/duplicate-candidate-row'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: '疑似重複帳號 — 啟動事工',
}

export default async function DuplicateAccountsPage() {
  // 守衛（登入 + admin 身分）由 (admin)/layout.tsx 統一處理
  const candidates = await findDuplicateCandidates()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">疑似重複帳號</h1>
          <p className="text-sm text-muted-foreground">
            姓名完全相同且至少命中一項輔助訊號的帳號配對，依信心等級排序，可直接開啟合併精靈處理
          </p>
        </div>
        <span className="text-sm text-muted-foreground">共 {candidates.length} 組</span>
      </div>

      {candidates.length === 0 ? (
        <div className="rounded-lg border p-10 text-center text-sm text-muted-foreground">
          目前無疑似重複帳號
        </div>
      ) : (
        <div className="space-y-4">
          {candidates.map((c) => (
            <DuplicateCandidateRow key={`${c.a.id}-${c.b.id}`} candidate={c} />
          ))}
        </div>
      )}
    </div>
  )
}
