/*
 * ----------------------------------------------
 * 教材申請進度（總需求／已申請／尚未申請）
 * 2026-06-28
 * lib/utils/material-progress.ts
 *
 * 總需求＝已核准學員 materialChoice 統計；已申請＝所有訂單繁/簡加總；
 * 尚未申請＝max(0, 總−已)。供課程詳情 UI 與 applyMaterialOrder 上限驗證共用。
 * ----------------------------------------------
 */

export type MaterialCount = { traditional: number; simplified: number; english: number }

export type MaterialProgress = {
  total: MaterialCount
  applied: MaterialCount
  remaining: MaterialCount
  canApplyMore: boolean
}

export function computeMaterialProgress(
  total: MaterialCount,
  orders: { traditionalQty: number; simplifiedQty: number; englishQty: number }[]
): MaterialProgress {
  const applied = orders.reduce<MaterialCount>(
    (a, o) => ({
      traditional: a.traditional + o.traditionalQty,
      simplified: a.simplified + o.simplifiedQty,
      english: a.english + o.englishQty,
    }),
    { traditional: 0, simplified: 0, english: 0 }
  )
  const remaining: MaterialCount = {
    traditional: Math.max(0, total.traditional - applied.traditional),
    simplified: Math.max(0, total.simplified - applied.simplified),
    english: Math.max(0, total.english - applied.english),
  }
  return {
    total,
    applied,
    remaining,
    canApplyMore: remaining.traditional + remaining.simplified + remaining.english > 0,
  }
}
