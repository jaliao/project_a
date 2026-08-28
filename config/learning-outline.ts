/*
 * ----------------------------------------------
 * 我的學習 — 課程大綱設定（單一事實來源）
 * 2026-08-28
 * config/learning-outline.ts
 *
 * 課程目錄（courseCatalogId）→ 課次（lesson）→ 經文項目（scripture）。
 * 學員的分段查經筆記（LearningStudyEntry）以 lessonKey / scriptureKey 參照此處。
 *
 * ⚠️ key 一經發布即視為「穩定識別」，不可再變更（否則既有筆記會對不上大綱）。
 *    顯示文字（title / label）可隨時調整；要新增課次或經文，追加即可。
 *    本次僅建置「啟動靈人」（courseCatalogId = 1）第一、二課；
 *    啟動豐盛（2）／啟動得勝（3）之課次內容待日後補上。
 * ----------------------------------------------
 */

export type ScriptureOutline = {
  /** 穩定識別（發布後不可變更） */
  key: string
  /** 顯示標籤，如「馬可福音一章」 */
  label: string
}

export type LessonOutline = {
  /** 穩定識別（發布後不可變更） */
  key: string
  /** 顯示排序（小→大） */
  order: number
  /** 顯示標題，如「第二課 開箱上帝所賜的生命之裡」 */
  title: string
  /** 經文項目；空陣列代表此課次無可填寫的分段查經（如「第一課 無」） */
  scriptures: ScriptureOutline[]
}

export type CatalogOutline = {
  courseCatalogId: number
  lessons: LessonOutline[]
}

/** courseCatalogId → 該目錄的大綱 */
export const LEARNING_OUTLINE: Record<number, CatalogOutline> = {
  1: {
    courseCatalogId: 1, // 啟動靈人
    lessons: [
      {
        key: 'lesson-01',
        order: 1,
        title: '第一課',
        scriptures: [],
      },
      {
        key: 'lesson-02',
        order: 2,
        title: '第二課 開箱上帝所賜的生命之裡',
        scriptures: [
          { key: 'mark-01', label: '馬可福音一章' },
          { key: 'luke-02', label: '路加福音二章' },
          { key: 'matthew-27', label: '馬太福音二十七章' },
        ],
      },
    ],
  },
}

/** 取得某課程目錄的大綱（無則 undefined） */
export function getCatalogOutline(courseCatalogId: number): CatalogOutline | undefined {
  return LEARNING_OUTLINE[courseCatalogId]
}

/** 有大綱的課程目錄 id 清單 */
export function getOutlineCatalogIds(): number[] {
  return Object.keys(LEARNING_OUTLINE).map(Number)
}

/** 取得某課次（無則 undefined） */
export function getLesson(courseCatalogId: number, lessonKey: string): LessonOutline | undefined {
  return getCatalogOutline(courseCatalogId)?.lessons.find((l) => l.key === lessonKey)
}

/** 取得某經文項目（無則 undefined） */
export function getScripture(
  courseCatalogId: number,
  lessonKey: string,
  scriptureKey: string
): ScriptureOutline | undefined {
  return getLesson(courseCatalogId, lessonKey)?.scriptures.find((s) => s.key === scriptureKey)
}

/**
 * 驗證 (courseCatalogId, lessonKey, scriptureKey) 是否為合法的大綱位置
 * （課次存在、且該經文項目確實掛在此課次下）。
 */
export function isValidOutlinePath(
  courseCatalogId: number,
  lessonKey: string,
  scriptureKey: string
): boolean {
  return !!getScripture(courseCatalogId, lessonKey, scriptureKey)
}
