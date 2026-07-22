/*
 * ----------------------------------------------
 * 開課門檻判定（UI 與 server action 共用）
 * 2026-06-28
 * lib/utils/course-start-gate.ts
 *
 * 開課條件：≥1 已核准學員 + 教材需求已處理 + 所有教材訂單已收件。
 * 教材需求已處理＝尚未申請需求為 0，或課程已標記「教材申請已完成」（materialFinalized）。
 * 全班皆不需教材（總需求=0、無訂單）時，後兩項視為成立。
 * 回傳 canStart 與未達成原因清單（供按鈕停用提示與 server 拒絕共用）。
 * ----------------------------------------------
 */

export type CourseStartGateOrder = {
  receivedAt: Date | null
}

export type CourseStartGate = {
  canStart: boolean
  reasons: string[]
}

export function evaluateCourseStartGate(input: {
  approvedCount: number
  remaining: { traditional: number; simplified: number; english: number }
  orders: CourseStartGateOrder[]
  // 教材申請已完成標記（CourseInvite.materialFinalizedAt != null）：豁免教材需求條件
  materialFinalized?: boolean
}): CourseStartGate {
  const reasons: string[] = []

  if (input.approvedCount < 1) {
    reasons.push('尚無已核准學員')
  }

  // 尚有教材需求未申請（有需求卻無訂單，或訂單涵蓋不足）；已標記完成教材申請則豁免
  const { traditional, simplified, english } = input.remaining
  if (!input.materialFinalized && traditional + simplified + english > 0) {
    reasons.push(`尚有教材未申請（繁 ${traditional}、簡 ${simplified}、英 ${english}）`)
  }

  // 所有教材訂單需皆已收件（無訂單時不檢查 → 全班不需教材可開課）
  if (input.orders.length > 0) {
    const received = input.orders.filter((o) => o.receivedAt != null).length
    if (received < input.orders.length) {
      reasons.push(`教材訂單尚未全部收件（${received}／${input.orders.length} 已收件）`)
    }
  }

  return { canStart: reasons.length === 0, reasons }
}
