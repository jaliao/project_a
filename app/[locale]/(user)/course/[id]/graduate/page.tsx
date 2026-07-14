/*
 * ----------------------------------------------
 * 課程結業表單頁
 * 2026-03-27
 * app/(user)/course/[id]/graduate/page.tsx
 * ----------------------------------------------
 */

export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { IconArrowLeft } from '@tabler/icons-react'
import { auth } from '@/lib/auth'
import { canAccessAdmin } from '@/lib/auth-roles'
import { getCourseSessionById } from '@/lib/data/course-sessions'
import { GraduationForm } from './graduation-form'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'course' })
  return { title: t('graduate.metaTitle') }
}

export default async function GraduatePage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>
}) {
  const { id, locale } = await params
  const t = await getTranslations({ locale, namespace: 'course.graduate' })
  const numId = parseInt(id, 10)
  if (isNaN(numId)) notFound()

  const [userSession, course] = await Promise.all([auth(), getCourseSessionById(numId)])

  if (!course) notFound()

  // 權限：課程建立者或管理者可操作
  if (
    !userSession?.user?.id ||
    (userSession.user.id !== course.createdBy.id && !canAccessAdmin(userSession.user.roles))
  ) {
    redirect(`/course/${numId}`)
  }

  // 已結業：導回詳情頁
  if (course.completedAt) {
    redirect(`/course/${numId}`)
  }

  const students = course.approvedEnrollments.map((e) => ({
    enrollmentId: e.id,
    userId: e.user.id,
    name: e.user.name,
    email: e.user.email,
    realName: e.user.realName,
    englishName: e.user.englishName,
    nickname: e.user.nickname,
    displayNameMode: e.user.displayNameMode,
  }))

  return (
    <div className="space-y-6 max-w-2xl">
      {/* 返回連結 */}
      <Link
        href={`/course/${numId}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <IconArrowLeft className="h-4 w-4" />
        {t('backToDetail')}
      </Link>

      <div>
        <h1 className="text-xl font-semibold">{t('title')}</h1>
        <p className="text-sm text-muted-foreground mt-1">{course.title}</p>
      </div>

      <GraduationForm inviteId={numId} students={students} />
    </div>
  )
}
