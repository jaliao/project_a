/*
 * ----------------------------------------------
 * CourseProgressCards - 學習進度三卡（基本資料區塊內）
 * 2026-07-03
 * components/learning/course-progress-cards.tsx
 * ----------------------------------------------
 */

import { IconCircleCheck, IconCircleDashed } from '@tabler/icons-react'
import type { CourseCatalogEntry } from '@/lib/data/course-catalog'
import type { CompletionCertificate } from '@/lib/data/course-sessions'

interface CourseProgressCardsProps {
  allCourses: CourseCatalogEntry[]
  certificates: CompletionCertificate[]
}

/**
 * 依課程目錄順序固定顯示各課程進度卡（啟動靈人／啟動豐盛／啟動得勝）：
 * - 已結業：完成樣式＋學業完成時間（每目錄取最新 graduatedAt）＋班名/老師小字
 * - 未結業：虛線/灰階未完成樣式
 * 公開資訊，本人與他人視角一致。
 */
export function CourseProgressCards({ allCourses, certificates }: CourseProgressCardsProps) {
  const certByCatalogId = new Map(certificates.map((c) => [c.courseCatalogId, c]))

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {allCourses.map((course) => {
        const cert = certByCatalogId.get(course.id)
        const g = cert?.graduatedAt
        const dateStr = g
          ? `${g.getFullYear()}/${String(g.getMonth() + 1).padStart(2, '0')}/${String(g.getDate()).padStart(2, '0')}`
          : null
        return (
          <div
            key={course.id}
            className={`rounded-md border px-3 py-2.5 text-sm space-y-1 ${
              cert
                ? 'border-primary/30 bg-primary/5'
                : 'border-dashed text-muted-foreground'
            }`}
          >
            <div className={`flex items-center gap-2 font-medium ${cert ? 'text-primary' : ''}`}>
              {cert ? (
                <IconCircleCheck className="h-4 w-4 shrink-0" />
              ) : (
                <IconCircleDashed className="h-4 w-4 shrink-0" />
              )}
              <span>{course.label}</span>
            </div>
            {cert ? (
              <div className="pl-6 space-y-0.5">
                <p className="text-xs text-foreground">學業完成：{dateStr}</p>
                <p className="text-xs text-muted-foreground">{cert.title} · {cert.teacherName}</p>
              </div>
            ) : (
              <p className="pl-6 text-xs">未完成</p>
            )}
          </div>
        )
      })}
    </div>
  )
}
