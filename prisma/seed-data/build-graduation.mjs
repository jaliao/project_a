/*
 * ----------------------------------------------
 * 啟動靈人結業名單產生器：證書 docx → graduation.json
 * 2026-07-02
 * prisma/seed-data/build-graduation.mjs
 *
 * 解析 doc/已領取-啟動靈人證書.docx + doc/待製作-啟動靈人證書.docx，
 * 比對 roster.json 後輸出「完成啟動靈人」的學員 roster key 清單。
 * 供 prisma/seed.ts 判定班級課程結業與學員結業/未結業（不涉證書製作）。
 * 用法：node prisma/seed-data/build-graduation.mjs
 * 先決條件：roster.json 已由 build-roster.mjs 產生；系統需有 unzip。
 * ----------------------------------------------
 */

import * as OpenCC from 'opencc-js'
import { execFileSync } from 'child_process'
import { readFileSync, writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..', '..')
const ROSTER_PATH = join(__dirname, 'roster.json')
const OUT_PATH = join(__dirname, 'graduation.json')
const DOCX = [
  join(ROOT, 'doc', '已領取-啟動靈人證書.docx'),
  join(ROOT, 'doc', '待製作-啟動靈人證書.docx'),
]

const s2t = OpenCC.Converter({ from: 'cn', to: 'tw' })
function cleanName(v) {
  return String(v ?? '')
    .replace(/[​-‏‪-‮⁠﻿]/g, '')
    .trim()
}

// 讀 docx（zip）的 word/document.xml，逐段落抽字，依 、／逗號／空白切名
function namesFromDocx(path) {
  const xml = execFileSync('unzip', ['-p', path, 'word/document.xml'], {
    maxBuffer: 64 * 1024 * 1024,
  }).toString('utf8')
  const paras = xml.match(/<w:p[ >][\s\S]*?<\/w:p>/g) || []
  const out = []
  for (const p of paras) {
    const text = cleanName(
      (p.match(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g) || []).map((t) => t.replace(/<[^>]*>/g, '')).join('')
    )
    if (!text) continue
    // 略過標題列（如「已領取過【啟動靈人】證書：」「…待製作【啟動靈人】證書：」）
    if (/證書\s*[：:]/.test(text)) continue
    for (const tok of text.split(/[、,，\s]+/)) {
      const v = cleanName(tok)
      if (v) out.push(v)
    }
  }
  return out
}

// ── 比對名冊 ──
const roster = JSON.parse(readFileSync(ROSTER_PATH, 'utf8'))
const byName = new Map()
for (const p of roster.people) {
  if (!byName.has(p.realName)) byName.set(p.realName, [])
  byName.get(p.realName).push(p)
}
// 姓名別名（證書名單與名冊拼法不同的同一人，經確認）
const ALIAS = { 李素貞: '李素真' } // 名冊已將此人更名為 李素真（A024）
const resolveKey = (name) => {
  const cand = byName.get(name) || byName.get(ALIAS[name]) || byName.get(s2t(name)) || []
  return cand.length ? cand[0].key : null
}

const allNames = DOCX.flatMap(namesFromDocx)
const holderKeys = new Set()
const unmatched = new Set()
for (const name of allNames) {
  const key = resolveKey(name)
  if (key) holderKeys.add(key)
  else unmatched.add(name)
}

const out = {
  generatedAt: new Date().toISOString(),
  sources: DOCX.map((d) => 'doc/' + d.split('/').pop()),
  // 完成啟動靈人的學員（roster key）；供班級結業/學員結業判定
  holderKeys: [...holderKeys],
  // 名冊查無對應的證書姓名（多為未建入名冊者，不影響班級判定）
  unmatchedCertNames: [...unmatched],
}
writeFileSync(OUT_PATH, JSON.stringify(out, null, 2), 'utf8')
console.log('✅ graduation.json 已產生：', OUT_PATH)
console.log('  證書姓名(去重):', new Set(allNames).size, '→ 對應名冊:', holderKeys.size, '／查無:', unmatched.size)
