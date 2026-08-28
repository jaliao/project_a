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
 *    「啟動靈人」（courseCatalogId = 1）已建置十二課（lesson-01 ~ lesson-12）。
 *    「啟動豐盛」（courseCatalogId = 2）已建置十二課（lesson-01 ~ lesson-12）。
 *    啟動得勝（3）之課次內容待日後補上。
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
        title: '第一課：接受禮物',
        scriptures: [],
      },
      {
        key: 'lesson-02',
        order: 2,
        title: '第二課：開箱上帝所賜的生命之禮',
        scriptures: [
          { key: 'mark-01', label: '馬可福音一章' },
          { key: 'luke-02', label: '路加福音二章' },
          { key: 'matthew-27', label: '馬太福音二十七章' },
        ],
      },
      {
        key: 'lesson-03',
        order: 3,
        title: '第三課：開啟靈覺（一）',
        scriptures: [
          { key: 'psalm-01', label: '詩篇一' },
          { key: '1john-03', label: '約翰一書三章' },
          { key: 'mark-11', label: '馬可福音十一章' },
        ],
      },
      {
        key: 'lesson-04',
        order: 4,
        title: '第四課：開啟靈覺（二）',
        scriptures: [
          { key: 'psalm-23', label: '詩篇二十三篇' },
          { key: 'matthew-06', label: '馬太福音六章' },
          { key: 'james-01', label: '雅各書一章' },
        ],
      },
      {
        key: 'lesson-05',
        order: 5,
        title: '第五課：開啟靈覺（三）',
        scriptures: [
          { key: 'james-02', label: '雅各書二章' },
          { key: 'james-03', label: '雅各書三章' },
          { key: 'james-04', label: '雅各書四章' },
        ],
      },
      {
        key: 'lesson-06',
        order: 6,
        title: '第六課：把屬靈化為實際（一）',
        scriptures: [
          { key: 'james-05', label: '雅各書五章' },
          { key: 'john-01', label: '約翰福音一章' },
          { key: 'john-02', label: '約翰福音二章' },
        ],
      },
      {
        key: 'lesson-07',
        order: 7,
        title: '第七課：把屬靈化為實際（二）',
        scriptures: [
          { key: 'john-03', label: '約翰福音三章' },
          { key: 'john-04', label: '約翰福音四章' },
          { key: 'john-05', label: '約翰福音五章' },
        ],
      },
      {
        key: 'lesson-08',
        order: 8,
        title: '第八課：靈人壓制（一）',
        scriptures: [
          { key: 'john-06', label: '約翰福音六章' },
          { key: 'john-07', label: '約翰福音七章' },
          { key: 'john-08', label: '約翰福音八章' },
        ],
      },
      {
        key: 'lesson-09',
        order: 9,
        title: '第九課：靈人壓制（二）',
        scriptures: [
          { key: 'john-11', label: '約翰福音十一章' },
          { key: 'john-12', label: '約翰福音十二章' },
          { key: 'john-13', label: '約翰福音十三章' },
        ],
      },
      {
        key: 'lesson-10',
        order: 10,
        title: '第十課：脫去舊人，穿上新人',
        scriptures: [
          { key: 'john-14', label: '約翰福音十四章' },
          { key: 'john-15', label: '約翰福音十五章' },
          { key: 'john-16', label: '約翰福音十六章' },
        ],
      },
      {
        key: 'lesson-11',
        order: 11,
        title: '第十一課：離開才能進入豐盛',
        scriptures: [
          { key: 'john-17', label: '約翰福音十七章' },
          { key: 'john-18', label: '約翰福音十八章' },
          { key: 'john-19', label: '約翰福音十九章' },
        ],
      },
      {
        key: 'lesson-12',
        order: 12,
        title: '第十二課：靈人全開啟',
        scriptures: [],
      },
    ],
  },
  2: {
    courseCatalogId: 2, // 啟動豐盛
    lessons: [
      {
        key: 'lesson-01',
        order: 1,
        title: '第一課：開啟祝福的第一步 孝敬父母',
        scriptures: [],
      },
      {
        key: 'lesson-02',
        order: 2,
        title: '第二課：婚姻（一）上帝的藍圖與設計',
        scriptures: [
          { key: 'genesis-02', label: '創世記二章' },
          { key: 'malachi-02', label: '瑪拉基書二章' },
          { key: 'ephesians-05', label: '以弗所書五章' },
        ],
      },
      {
        key: 'lesson-03',
        order: 3,
        title: '第三課：婚姻（二）婚姻 101',
        scriptures: [
          { key: 'psalm-32', label: '詩篇三十二篇' },
          { key: 'psalm-51', label: '詩篇五十一篇' },
          { key: 'psalm-62', label: '詩篇六十二篇' },
        ],
      },
      {
        key: 'lesson-04',
        order: 4,
        title: '第四課：我們的下一代 以神為中心的敬虔之路',
        scriptures: [
          { key: 'hebrews-12', label: '希伯來書十二章' },
          { key: 'colossians-03', label: '歌羅西書三章' },
          { key: 'proverbs-22', label: '箴言二十二章' },
        ],
      },
      {
        key: 'lesson-05',
        order: 5,
        title: '第五課：靈人啟動後的全新關係',
        scriptures: [
          { key: '1corinthians-12', label: '哥林多前書十二章' },
          { key: 'ephesians-02', label: '以弗所書二章' },
          { key: 'romans-12', label: '羅馬書十二章' },
        ],
      },
      {
        key: 'lesson-06',
        order: 6,
        title: '第六課：新人與工作',
        scriptures: [
          { key: 'genesis-01', label: '創世記一章' },
          { key: 'mark-10', label: '馬可福音十章' },
          { key: 'matthew-20', label: '馬太福音二十章' },
        ],
      },
      {
        key: 'lesson-07',
        order: 7,
        title: '第七課：喜樂的心乃是良藥',
        scriptures: [
          { key: 'matthew-06', label: '馬太福音六章' },
          { key: 'isaiah-30', label: '以賽亞書三十章' },
          { key: 'philippians-04', label: '腓立比書四章' },
        ],
      },
      {
        key: 'lesson-08',
        order: 8,
        title: '第八課：醫治（一）祂能，祂也肯',
        scriptures: [
          { key: 'isaiah-53', label: '以賽亞書五十三章' },
          { key: 'matthew-08', label: '馬太福音八章' },
          { key: '1peter-02', label: '彼得前書二章' },
        ],
      },
      {
        key: 'lesson-09',
        order: 9,
        title: '第九課：醫治（二）今天就支取醫治的恩典',
        scriptures: [
          { key: 'hebrews-11', label: '希伯來書十一章' },
          { key: 'romans-08', label: '羅馬書八章' },
          { key: 'mark-02', label: '馬可福音二章' },
        ],
      },
      {
        key: 'lesson-10',
        order: 10,
        title: '第十課：醫治（三）拆毀堅固的營壘',
        scriptures: [
          { key: 'romans-10', label: '羅馬書十章' },
          { key: 'ephesians-06', label: '以弗所書六章' },
          { key: 'mark-09', label: '馬可福音九章' },
        ],
      },
      {
        key: 'lesson-11',
        order: 11,
        title: '第十一課：神國金錢觀',
        scriptures: [
          { key: 'luke-16', label: '路加福音十六章' },
          { key: 'deuteronomy-08', label: '申命記八章' },
          { key: 'psalm-49', label: '詩篇四十九篇' },
        ],
      },
      {
        key: 'lesson-12',
        order: 12,
        title: '第十二課：兒子的真正自由',
        scriptures: [
          { key: 'luke-18', label: '路加福音十八章' },
          { key: '2corinthians-08', label: '哥林多後書八章' },
          { key: '2corinthians-09', label: '哥林多後書九章' },
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

/**
 * 課次的分段查經填寫狀態（四態）：
 * - `noScripture`：課次無經文項目（視為已完成、標「無需填寫」）
 * - `todo`：有經文項目、一格都沒填
 * - `partial`：有經文項目、填了一部分（1 格以上、未填滿）
 * - `done`：有經文項目、每一格都至少有一筆筆記
 */
export type LessonFillState = 'noScripture' | 'todo' | 'partial' | 'done'

/**
 * 依「已填經文位置集合」（key = `${lessonKey}::${scriptureKey}`）計算課次的四態。
 * 純函式，client / server 皆可用。
 */
export function lessonFillState(lesson: LessonOutline, filledSlots: Set<string>): LessonFillState {
  const total = lesson.scriptures.length
  if (total === 0) return 'noScripture'
  const filled = lesson.scriptures.filter((s) =>
    filledSlots.has(`${lesson.key}::${s.key}`)
  ).length
  if (filled === 0) return 'todo'
  if (filled < total) return 'partial'
  return 'done'
}

/** 課次是否計入「已完成課次數」（`done` 或 `noScripture`）。 */
export function isLessonCompleted(lesson: LessonOutline, filledSlots: Set<string>): boolean {
  const st = lessonFillState(lesson, filledSlots)
  return st === 'done' || st === 'noScripture'
}
