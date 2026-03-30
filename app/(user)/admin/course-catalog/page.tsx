/*
 * ----------------------------------------------
 * Admin 課程目錄管理頁面
 * 2026-03-30
 * app/(user)/admin/course-catalog/page.tsx
 * ----------------------------------------------
 */

export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { IconArrowLeft, IconBook } from '@tabler/icons-react'
import { auth } from '@/lib/auth'
import { getAllCourses } from '@/lib/data/course-catalog'
import { CourseCatalogTable } from '@/components/course-catalog/course-catalog-table'

export const metadata: Metadata = {
  title: '課程目錄管理 — 啟動靈人系統',
}

export default async function AdminCourseCatalogPage() {
  const session = await auth()

  // 僅 admin/superadmin 可存取
  const isAdmin = session?.user?.role === 'admin' || session?.user?.role === 'superadmin'
  if (!isAdmin) redirect('/dashboard')

  const courses = await getAllCourses()

  return (
    <div className="space-y-6">
      <Link
        href="/admin"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <IconArrowLeft className="h-4 w-4" />
        返回管理後台
      </Link>

      <div className="flex items-center gap-2">
        <IconBook className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-semibold">課程目錄管理</h1>
      </div>

      <CourseCatalogTable courses={courses} />
    </div>
  )
}
