/*
 * ----------------------------------------------
 * CourseCardGrid - 課程卡片響應式網格容器
 * 2026-03-26
 * components/course-session/course-card-grid.tsx
 * ----------------------------------------------
 */

type CourseCardGridProps = {
  children: React.ReactNode
}

export function CourseCardGrid({ children }: CourseCardGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
      {children}
    </div>
  )
}
