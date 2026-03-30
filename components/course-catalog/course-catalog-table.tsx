/*
 * ----------------------------------------------
 * CourseCatalogTable - 課程目錄列表
 * 2026-03-30
 * components/course-catalog/course-catalog-table.tsx
 * ----------------------------------------------
 */

'use client'

import { useState } from 'react'
import { IconEdit } from '@tabler/icons-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EditCourseDialog } from './edit-course-dialog'
import type { CourseCatalogEntry } from '@/lib/data/course-catalog'

interface CourseCatalogTableProps {
  courses: CourseCatalogEntry[]
}

export function CourseCatalogTable({ courses }: CourseCatalogTableProps) {
  const [editingCourse, setEditingCourse] = useState<CourseCatalogEntry | null>(null)

  return (
    <>
      <div className="rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr className="text-muted-foreground text-left">
              <th className="px-4 py-3 font-medium">課程名稱</th>
              <th className="px-4 py-3 font-medium">狀態</th>
              <th className="px-4 py-3 font-medium hidden sm:table-cell">先修課程</th>
              <th className="px-4 py-3 font-medium w-16" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {courses.map((course) => (
              <tr key={course.id} className="hover:bg-muted/30">
                <td className="px-4 py-3 font-medium">{course.label}</td>
                <td className="px-4 py-3">
                  {course.isActive ? (
                    <Badge variant="default" className="bg-green-100 text-green-700 hover:bg-green-100">開放</Badge>
                  ) : (
                    <Badge variant="secondary">未開放</Badge>
                  )}
                </td>
                <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                  {course.prerequisites.length === 0
                    ? '—'
                    : course.prerequisites.map((p) => p.label).join('、')}
                </td>
                <td className="px-4 py-3 text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingCourse(course)}
                    className="h-8 w-8 p-0"
                  >
                    <IconEdit className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editingCourse && (
        <EditCourseDialog
          course={editingCourse}
          allCourses={courses}
          open={!!editingCourse}
          onOpenChange={(open) => { if (!open) setEditingCourse(null) }}
        />
      )}
    </>
  )
}
