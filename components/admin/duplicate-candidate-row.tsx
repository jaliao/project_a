/*
 * ----------------------------------------------
 * 疑似重複帳號 — 單組候選配對（Client Component）
 * 2026-10-16
 * components/admin/duplicate-candidate-row.tsx
 *
 * cr-feat-261016-003：從 app/(admin)/admin/members/duplicates/page.tsx 的
 * server component 抽出為 client 子元件，新增「合併這兩筆帳號」入口
 * （掛載 MemberMergeDialog，兩邊帳號已知，略過搜尋步驟）；頁面本身
 * 仍只做純查詢，本元件不新增任何額外的 Server Action 呼叫。
 * ----------------------------------------------
 */

'use client'

import Link from 'next/link'
import type { DuplicateCandidate, DuplicateCandidateSide, DuplicateConfidence } from '@/lib/data/duplicate-accounts'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MaskedValue } from '@/components/admin/masked-value'
import { getIdentityTags } from '@/lib/utils/identity-tags'
import { IdentityTagBadges } from '@/components/shared/identity-tag-badges'
import { MemberHomeLink } from '@/components/admin/member-home-link'
import { MemberMergeDialog } from '@/components/admin/member-merge-dialog'

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
      <div className="flex items-center gap-1.5">
        <span className="font-medium">{side.displayName}</span>
        <IdentityTagBadges tags={getIdentityTags(undefined, side.isProxyMember)} />
      </div>
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

export function DuplicateCandidateRow({ candidate }: { candidate: DuplicateCandidate }) {
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
      <MemberMergeDialog
        anchorAccount={{ id: candidate.a.id, displayName: candidate.a.displayName, spiritId: candidate.a.spiritId, email: candidate.a.email }}
        initialOtherAccount={{ id: candidate.b.id, displayName: candidate.b.displayName, spiritId: candidate.b.spiritId, email: candidate.b.email }}
        triggerLabel="合併這兩筆帳號"
      />
    </div>
  )
}
