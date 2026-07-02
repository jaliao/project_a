/*
 * ----------------------------------------------
 * 啟動豐盛種子班名單產生器：Excel → prosperity-seed.json
 * 2026-07-02
 * prisma/seed-data/build-prosperity-seed.mjs
 *
 * 解析 doc/啟動豐盛種子教師名單.xlsx，比對 roster.json 後輸出
 * 黃國倫啟動豐盛種子班（courseCatalogId=2）的學員 roster key 清單。
 * 供 prisma/seed.ts 消費（執行期不讀 xlsx）。
 * 用法：node prisma/seed-data/build-prosperity-seed.mjs
 * 先決條件：roster.json 已由 build-roster.mjs 產生。
 * ----------------------------------------------
 */

import * as XLSX from 'xlsx'
import * as OpenCC from 'opencc-js'
import { readFileSync, writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..', '..')
const XLSX_PATH = join(ROOT, 'doc', '啟動豐盛種子教師名單.xlsx')
const ROSTER_PATH = join(__dirname, 'roster.json')
const OUT_PATH = join(__dirname, 'prosperity-seed.json')

const s2t = OpenCC.Converter({ from: 'cn', to: 'tw' })

// 清除隱藏字元 + 去前後空白（比照 build-roster.mjs）
function cleanName(v) {
  return String(v ?? '')
    .replace(/[​-‏‪-‮⁠﻿]/g, '')
    .trim()
}

// ── 人工對應（依名單提供者確認）──
const ALIAS = {} // 姓名別名（目前無；李素真 已直接存在於名冊）
const AMBIG = { 黃宣志: '黃宣志' } // 名冊有兩位黃宣志（B006/B071）皆 101教會 → 指定 B006（realName=黃宣志 那筆）

// ── 解析名單 ──
const wb = XLSX.read(readFileSync(XLSX_PATH))
const rows = XLSX.utils
  .sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, defval: null })
  .slice(2) // 略過標題列與欄名列
const list = rows.filter((r) => r && r[1]).map((r) => cleanName(r[1]))

// ── 比對名冊 ──
const roster = JSON.parse(readFileSync(ROSTER_PATH, 'utf8'))
const byName = new Map()
for (const p of roster.people) {
  if (!byName.has(p.realName)) byName.set(p.realName, [])
  byName.get(p.realName).push(p)
}

const teacherKeys = []
const unresolved = []
for (const name of list) {
  let key = AMBIG[name] || null
  if (!key) {
    const cand = byName.get(name) || byName.get(ALIAS[name]) || byName.get(s2t(name)) || []
    if (cand.length >= 1) key = cand[0].key
  }
  if (!key) {
    unresolved.push(name)
    continue
  }
  if (!teacherKeys.includes(key)) teacherKeys.push(key)
}

if (unresolved.length) {
  console.error('❌ 以下名單姓名無法對應名冊，請確認 xlsx 或補 ALIAS：', unresolved)
  process.exit(1)
}

const out = {
  generatedAt: new Date().toISOString(),
  source: 'doc/啟動豐盛種子教師名單.xlsx',
  courseCatalogId: 2, // 啟動豐盛
  title: '黃國倫啟動豐盛種子班',
  teacherKeys,
}
writeFileSync(OUT_PATH, JSON.stringify(out, null, 2), 'utf8')
console.log('✅ prosperity-seed.json 已產生：', OUT_PATH)
console.log('  名單人數:', list.length, '→ 入班學員:', teacherKeys.length)
