/*
 * ----------------------------------------------
 * Spirit ID 核發工具
 * 2026-03-23
 * lib/spirit-id.ts
 *
 * 格式：PA + YY（西元年後兩位）+ XXXX（四位流水號）
 * 範例：PA260001（2026 年第一位會員）
 * 跨年時流水號從 0001 重新計算
 * ----------------------------------------------
 */

import { prisma } from './prisma'

/**
 * 原子性核發 Spirit ID
 * 使用 prisma.$transaction 確保並發安全
 */
export async function generateSpiritId(): Promise<string> {
  const now = new Date()
  const year = now.getFullYear()
  const yy = year % 100 // 取後兩位，例如 2026 → 26

  const counter = await prisma.$transaction(async (tx) => {
    // upsert：若當年計數器不存在則建立，存在則遞增
    return tx.spiritIdCounter.upsert({
      where: { year },
      update: { seq: { increment: 1 } },
      create: { year, seq: 1 },
    })
  })

  // 格式化：PA + YY（補零至2位）+ seq（補零至4位）
  const yyStr = String(yy).padStart(2, '0')
  const seqStr = String(counter.seq).padStart(4, '0')

  return `PA${yyStr}${seqStr}`
}
