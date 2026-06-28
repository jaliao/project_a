/*
 * ----------------------------------------------
 * 開課門檻判定（UI 與 server action 共用）
 * 2026-06-28
 * lib/utils/course-start-gate.ts
 *
 * 開課條件：≥1 已核准學員 + 至少一筆教材訂單且全部已收件。
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
  orders: CourseStartGateOrder[]
}): CourseStartGate {
  const reasons: string[] = []

  if (input.approvedCount < 1) {
    reasons.push('尚無已核准學員')
  }

  if (input.orders.length === 0) {
    reasons.push('尚未申請任何教材')
  } else {
    const received = input.orders.filter((o) => o.receivedAt != null).length
    if (received < input.orders.length) {
      reasons.push(`教材訂單尚未全部收件（${received}／${input.orders.length} 已收件）`)
    }
  }

  return { canStart: reasons.length === 0, reasons }
}
