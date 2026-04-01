/*
 * ----------------------------------------------
 * ECPay 物流工具函式
 * 2026-04-01
 * lib/ecpay/logistics.ts
 * ----------------------------------------------
 */

import { createHash } from 'crypto'

// .NET URL encode 字元還原表（物流 CMV-MD5 規格）
const NET_CHAR_REPLACEMENTS: [string, string][] = [
  ['%2d', '-'],
  ['%5f', '_'],
  ['%2e', '.'],
  ['%21', '!'],
  ['%2a', '*'],
  ['%28', '('],
  ['%29', ')'],
]

/**
 * ECPay 物流版 URL encode（CMV-MD5 規格）
 * encodeURIComponent → 空格換 + → toLowerCase → .NET 字元還原
 */
function ecpayLogisticsUrlEncode(str: string): string {
  let encoded = encodeURIComponent(str)
    .replace(/%20/g, '+')
    .toLowerCase()

  for (const [from, to] of NET_CHAR_REPLACEMENTS) {
    encoded = encoded.split(from).join(to)
  }

  return encoded
}

/**
 * 計算 ECPay 物流 CheckMacValue（MD5）
 *
 * 流程：字母序排序 → 組 query string → 加 HashKey/HashIV →
 *       ecpayLogisticsUrlEncode → MD5 → 大寫
 */
export function calcLogisticsCheckMacValue(
  params: Record<string, string>,
  hashKey: string,
  hashIV: string,
): string {
  // 1. 依 key 字母序排序（不分大小寫）
  const sorted = Object.entries(params).sort(([a], [b]) =>
    a.toLowerCase().localeCompare(b.toLowerCase()),
  )

  // 2. 組成 query string
  const queryString = sorted.map(([k, v]) => `${k}=${v}`).join('&')

  // 3. 前後加上 HashKey / HashIV
  const raw = `HashKey=${hashKey}&${queryString}&HashIV=${hashIV}`

  // 4. URL encode
  const encoded = ecpayLogisticsUrlEncode(raw)

  // 5. MD5 → 大寫
  return createHash('md5').update(encoded).digest('hex').toUpperCase()
}
