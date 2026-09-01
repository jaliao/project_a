/*
 * ----------------------------------------------
 * 後台儀錶板頁面
 * 2026-04-03 (Updated: 2026-09-01)
 * app/[locale]/(admin)/admin/dashboard/page.tsx
 * ----------------------------------------------
 */

import type { Metadata } from 'next'
import { getDashboardStats } from '@/lib/data/dashboard'
import {
  getAvailableReportMonths,
  getMonthlyReport,
} from '@/lib/data/monthly-report'
import { ChurchDistributionCharts } from './church-distribution-charts'
import { GenderPieCard, AgeBarCard } from './member-demographics-charts'
import MonthlyReportSection from './monthly-report-section'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: '儀錶板 — 啟動事工',
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border p-5 space-y-1">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-3xl font-bold">{value.toLocaleString()}</p>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">{children}</div>
    </section>
  )
}

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>
}) {
  // 守衛（登入 + admin 身分）由 (admin)/layout.tsx 統一處理
  const { month } = await searchParams
  const [stats, report, months] = await Promise.all([
    getDashboardStats(),
    getMonthlyReport(month),
    getAvailableReportMonths(),
  ])

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">儀錶板</h1>

      {/* 學員分析（包含講師） */}
      <Section title="學員分析">
        <StatCard label="學員總數" value={stats.totalMembers} />
        <StatCard label="近期活躍學員數（7 天內登入）" value={stats.activeMembers7d} />
        <GenderPieCard genderCounts={stats.genderCounts} />
        <AgeBarCard
          ageDistribution={stats.ageDistribution}
          noBirthYearCount={stats.noBirthYearCount}
        />
        <ChurchDistributionCharts
          distribution={stats.churchDistribution}
          otherCount={stats.otherChurchCount}
          noneCount={stats.noChurchCount}
        />
      </Section>

      {/* 講師分析 */}
      <Section title="講師分析">
        <StatCard label="啟動講師" value={stats.spiritInstructors} />
        <StatCard label="豐盛講師" value={stats.richInstructors} />
        <StatCard label="得勝講師" value={stats.victoryInstructors} />
      </Section>

      {/* 課程分析 */}
      <Section title="課程分析">
        <StatCard label="招募中課程總數" value={stats.recruitingCourseSessions} />
        <StatCard label="進行中課程總數" value={stats.activeCourseSessions} />
        <StatCard label="已結業課程總數" value={stats.completedCourseSessions} />
        <StatCard label="已放棄課程總數" value={stats.cancelledCourseSessions} />
      </Section>

      {/* 月報 */}
      <MonthlyReportSection report={report} months={months} />
    </div>
  )
}
