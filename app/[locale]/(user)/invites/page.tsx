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
import { getTranslations } from 'next-intl/server'
import { getMyInvites } from '@/app/actions/course-invite'
import { InviteCopyButton } from '@/components/course-invite/invite-copy-button'
import { getMemberDisplayName } from '@/lib/utils/member-display'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'invites' })
  return { title: t('metaTitle') }
}

export default async function InvitesPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'invites' })
  const invites = await getMyInvites()

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">{t('title')}</h1>

      {invites.length === 0 ? (
        <p className="text-muted-foreground text-sm">{t('empty')}</p>
      ) : (
        <div className="space-y-4">
          {invites.map((invite) => (
            <div key={invite.id} className="rounded-lg border bg-card p-5 space-y-3">
              {/* 邀請標題與操作 */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold">{invite.title}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {t('capacity', { max: invite.maxCount, approved: invite.enrollments.length })}
                    {invite.orders.length > 0 && (
                      <span className="ml-2">
                        ・{t('orders', { count: invite.orders.length })}
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {t('createdAtPrefix')}{' '}
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
                <p className="text-sm text-muted-foreground">{t('noStudents')}</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-muted-foreground text-left">
                      <th className="pb-1 font-medium">{t('name')}</th>
                      <th className="pb-1 font-medium">Email</th>
                      <th className="pb-1 font-medium">{t('joinedAt')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {invite.enrollments.map((e) => (
                      <tr key={e.id}>
                        <td className="py-1.5">{getMemberDisplayName(e.user)}</td>
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
