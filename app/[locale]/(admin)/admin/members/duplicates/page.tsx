/*
 * ----------------------------------------------
 * 後台疑似重複帳號清單
 * 2026-10-16
 * app/(admin)/admin/members/duplicates/page.tsx
 *
 * 列出 realName 完全相同且至少命中一項輔助訊號的帳號配對，依信心等級分級呈現。
 * 純唯讀，不提供任何合併／刪除／編輯操作（合併動作見 CR-FEAT-261016-003）。
 * ----------------------------------------------
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import {
  findDuplicateCandidates,
  type DuplicateCandidate,
  type DuplicateCandidateSide,
  type DuplicateConfidence,
} from '@/lib/data/duplicate-accounts'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MaskedValue } from '@/components/admin/masked-value'
import { MemberHomeLink } from '@/components/admin/member-home-link'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: '疑似重複帳號 — 啟動事工',
}

const CONFIDENCE_BADGE: Record<DuplicateConfidence, { variant: 'destructive' | 'default' | 'secondary'; label: string }> = {
  最高: { variant: 'destructive', label: '最高信心' },
  高: { variant: 'default', label: '高信心' },
  中: { variant: 'secondary', label: '中信心' },
}

function formatDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}/${m}/${day}`
}

function CandidateSideCard({ side }: { side: DuplicateCandidateSide }) {
  return (
    <div className="flex-1 space-y-2 rounded-md border bg-muted/20 p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-xs text-muted-foreground">{side.spiritId ?? '—'}</span>
        {side.lastLoginAt === null && (
          <Badge variant="outline" className="text-xs">未啟用</Badge>
        )}
      </div>
      <div className="font-medium">{side.displayName}</div>
      <dl className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-1 text-sm text-muted-foreground">
        <dt>Email</dt>
        <dd><MaskedValue value={side.email} label="Email" /></dd>
        <dt>建立時間</dt>
        <dd>{formatDate(side.createdAt)}</dd>
        <dt>報名/結業</dt>
        <dd>{side.enrollmentCount} 筆 / {side.graduatedCount} 筆結業</dd>
      </dl>
      <div className="flex items-center gap-2 pt-1">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/admin/members/${side.id}`}>查看詳情</Link>
        </Button>
        <MemberHomeLink spiritId={side.spiritId} />
      </div>
    </div>
  )
}

function CandidateRow({ candidate }: { candidate: DuplicateCandidate }) {
  const badge = CONFIDENCE_BADGE[candidate.confidence]
  return (
    <div className="space-y-3 rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <span className="font-medium">{candidate.realName}</span>
        <Badge variant={badge.variant}>{badge.label}</Badge>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <CandidateSideCard side={candidate.a} />
        <CandidateSideCard side={candidate.b} />
      </div>
    </div>
  )
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
            姓名完全相同且至少命中一項輔助訊號的帳號配對，依信心等級排序，僅供人工核對，無任何合併操作
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
            <CandidateRow key={`${c.a.id}-${c.b.id}`} candidate={c} />
          ))}
        </div>
      )}
    </div>
  )
}
