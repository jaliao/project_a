/*
 * ----------------------------------------------
 * 課程目錄設定（config-driven）
 * 2026-03-23
 * config/course-catalog.ts
 * ----------------------------------------------
 */

export type CourseLevel = 'level1' | 'level2' | 'level3' | 'level4'

export type CourseCatalogEntry = {
  level: CourseLevel
  levelNum: number        // 1–4，用於先修比較
  label: string           // 顯示名稱
  isActive: boolean       // 是否開放開課與報名
  prerequisiteLevel: number | null  // 報名先修（null = 無先修）
}

export const COURSE_CATALOG: Record<CourseLevel, CourseCatalogEntry> = {
  level1: {
    level: 'level1',
    levelNum: 1,
    label: '啟動靈人 1',
    isActive: true,
    prerequisiteLevel: null,
  },
  level2: {
    level: 'level2',
    levelNum: 2,
    label: '啟動靈人 2',
    isActive: true,
    prerequisiteLevel: 1,
  },
  level3: {
    level: 'level3',
    levelNum: 3,
    label: '啟動靈人 3',
    isActive: false,
    prerequisiteLevel: 2,
  },
  level4: {
    level: 'level4',
    levelNum: 4,
    label: '啟動靈人 4',
    isActive: false,
    prerequisiteLevel: 3,
  },
}

export const COURSE_LEVEL_VALUES = Object.keys(COURSE_CATALOG) as CourseLevel[]

/** 取得所有開放中的課程（isActive = true） */
export function getActiveCourses(): CourseCatalogEntry[] {
  return COURSE_LEVEL_VALUES
    .map((k) => COURSE_CATALOG[k])
    .filter((c) => c.isActive)
}

/** 取得指定等級的課程設定 */
export function getCourse(level: CourseLevel): CourseCatalogEntry {
  return COURSE_CATALOG[level]
}
