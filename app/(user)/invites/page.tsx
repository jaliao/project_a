/*
 * ----------------------------------------------
 * 邀請進度頁
 * 2026-03-23
 * app/(user)/invites/page.tsx
 * ----------------------------------------------
 */

export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import { formatDistanceToNow } from 'date-fns'
import { zhTW } from 'date-fns/locale'
import { getMyInvites } from '@/app/actions/course-invite'
import { InviteCopyButton } from '@/components/course-invite/invite-copy-button'

export const metadata: Metadata = {
  title: '邀請進度 — 啟動事工',
}

export default async function InvitesPage() {
  const invites = await getMyInvites()

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">邀請進度</h1>

      {invites.length === 0 ? (
        <p className="text-muted-foreground text-sm">尚未建立任何邀請</p>
      ) : (
        <div className="space-y-4">
          {invites.map((invite) => (
            <div key={invite.id} className="rounded-lg border bg-card p-5 space-y-3">
              {/* 邀請標題與操作 */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold">{invite.title}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    預計 {invite.maxCount} 人・已確認 {invite.enrollments.length} 人
                    {invite.courseOrder && (
                      <span className="ml-2">
                        ・訂單 #{invite.courseOrder.id}（{invite.courseOrder.buyerNameZh}）
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    建立於{' '}
                    {formatDistanceToNow(invite.createdAt, {
                      addSuffix: true,
                      locale: zhTW,
                    })}
                  </p>
                </div>
                <InviteCopyButton courseId={invite.id} />
              </div>

              {/* 學員列表 */}
              {invite.enrollments.length === 0 ? (
                <p className="text-sm text-muted-foreground">尚無學員加入</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-muted-foreground text-left">
                      <th className="pb-1 font-medium">姓名</th>
                      <th className="pb-1 font-medium">Email</th>
                      <th className="pb-1 font-medium">加入時間</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {invite.enrollments.map((e) => (
                      <tr key={e.id}>
                        <td className="py-1.5">{e.user.name ?? '（未設定）'}</td>
                        <td className="py-1.5 text-muted-foreground">{e.user.email}</td>
                        <td className="py-1.5 text-muted-foreground whitespace-nowrap">
                          {formatDistanceToNow(e.joinedAt, {
                            addSuffix: true,
                            locale: zhTW,
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
