/*
 * ----------------------------------------------
 * 學習紀錄頁面
 * 2026-03-23 (Updated: 2026-03-30)
 * app/(user)/learning/page.tsx
 * ----------------------------------------------
 */

export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import { formatDistanceToNow } from 'date-fns'
import { zhTW } from 'date-fns/locale'
import { IconAward } from '@tabler/icons-react'
import { auth } from '@/lib/auth'
import { getMyLearningRecords } from '@/app/actions/course-invite'
import { getMyCompletionCertificates } from '@/lib/data/course-sessions'
import { getAllCourses, getGraduatedCatalogIds } from '@/lib/data/course-catalog'
import { LevelProgress } from '@/components/learning/level-progress'

export const metadata: Metadata = {
  title: '學習紀錄 — 啟動事工',
}

export default async function LearningPage() {
  const session = await auth()
  const userId = session?.user?.id

  const [{ enrollments, invites }, graduationRecords, allCourses, graduatedCatalogIds] = await Promise.all([
    getMyLearningRecords(),
    userId ? getMyCompletionCertificates(userId) : Promise.resolve([]),
    getAllCourses(),
    userId ? getGraduatedCatalogIds(userId) : Promise.resolve(new Set<number>()),
  ])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">學習紀錄</h1>

      {/* 學習進度摘要 */}
      <LevelProgress allCourses={allCourses} graduatedCatalogIds={graduatedCatalogIds} />

      {/* 已完成學習（學員） */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">已完成學習</h2>
        {enrollments.length === 0 ? (
          <p className="text-sm text-muted-foreground">尚無學習紀錄</p>
        ) : (
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr className="text-muted-foreground text-left">
                  <th className="px-4 py-2.5 font-medium">課程</th>
                  <th className="px-4 py-2.5 font-medium">授課教師</th>
                  <th className="px-4 py-2.5 font-medium">完成時間</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {enrollments.map((e) => (
                  <tr key={e.id}>
                    <td className="px-4 py-3 font-medium">{e.invite.title}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {e.invite.createdBy.realName ?? e.invite.createdBy.name ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                      {formatDistanceToNow(e.joinedAt, { addSuffix: true, locale: zhTW })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* 結業紀錄 */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <IconAward className="h-5 w-5 text-amber-500" />
          <h2 className="text-lg font-semibold">結業紀錄</h2>
        </div>
        {graduationRecords.length === 0 ? (
          <p className="text-sm text-muted-foreground">尚無結業紀錄</p>
        ) : (
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr className="text-muted-foreground text-left">
                  <th className="px-4 py-2.5 font-medium">課程名稱</th>
                  <th className="px-4 py-2.5 font-medium">等級</th>
                  <th className="px-4 py-2.5 font-medium">授課教師</th>
                  <th className="px-4 py-2.5 font-medium">結業日期</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {graduationRecords.map((rec) => {
                  const g = rec.graduatedAt
                  const dateStr = `${g.getFullYear()}/${String(g.getMonth() + 1).padStart(2, '0')}/${String(g.getDate()).padStart(2, '0')}`
                  return (
                    <tr key={rec.courseCatalogId}>
                      <td className="px-4 py-3 font-medium">{rec.title}</td>
                      <td className="px-4 py-3 text-muted-foreground">{rec.courseCatalogLabel}</td>
                      <td className="px-4 py-3 text-muted-foreground">{rec.teacherName}</td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{dateStr}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* 已完成授課（教師） */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">已完成授課</h2>
        {invites.length === 0 ? (
          <p className="text-sm text-muted-foreground">尚無授課紀錄</p>
        ) : (
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr className="text-muted-foreground text-left">
                  <th className="px-4 py-2.5 font-medium">課程</th>
                  <th className="px-4 py-2.5 font-medium">報名人數</th>
                  <th className="px-4 py-2.5 font-medium">建立時間</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {invites.map((inv) => (
                  <tr key={inv.id}>
                    <td className="px-4 py-3 font-medium">{inv.title}</td>
                    <td className="px-4 py-3 text-muted-foreground">{inv._count.enrollments} 人</td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                      {formatDistanceToNow(inv.createdAt, { addSuffix: true, locale: zhTW })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
