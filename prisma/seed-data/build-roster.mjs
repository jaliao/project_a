/*
 * ----------------------------------------------
 * 名冊產生器：Excel → roster.json
 * 2026-06-05
 * prisma/seed-data/build-roster.mjs
 *
 * 解析 doc/啟動事工資料表_updated.xlsx，輸出正規化後的 roster.json
 * 供 prisma/seed.ts 消費（執行期不讀 xlsx）。
 * 用法：node prisma/seed-data/build-roster.mjs
 * ----------------------------------------------
 */

import * as XLSX from 'xlsx'
import { writeFileSync, readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..', '..')
const XLSX_PATH = join(ROOT, 'doc', '啟動事工資料表_updated.xlsx')
const OUT_PATH = join(__dirname, 'roster.json')

// ── 既有保留帳號（不由名冊建立，但可作為課程/報名對象）──
const RESERVED = {
  系統管理員: { email: '101@iwillshare.org.tw', spiritId: 'PA000001' },
  黃國倫: { email: 'gordon@test.com', spiritId: 'PA260001' },
}

// ── 教會正規化對應 ──
function normChurch(u) {
  const s = String(u || '').trim()
  if (!s) return null
  if (s === 'GMI榮美' || s === 'GMI榮美教會') return 'GMI榮美教會'
  if (s === 'i61為光教會' || s === 'i61爲光教會') return 'i61為光教會'
  return s
}

const SYNTH_DOMAIN = 'seed.iwillshare.org.tw'
function pad4(n) {
  return String(n).padStart(4, '0')
}

// 清除姓名/編號中的隱藏字元（word joiner U+2060、零寬字元、BOM、方向控制字元）
// 並去除前後空白；保留英文名內部空白（如 "Stella Poon"）。
// Excel 來源偶有 U+2060 汙染，導致教師欄與班級名單同名卻比對失敗（誤入收容班）。
function cleanName(v) {
  return String(v ?? '')
    .replace(/[\u200B-\u200F\u202A-\u202E\u2060\uFEFF]/g, '')
    .trim()
}

// ── 解析 ──
const wb = XLSX.read(readFileSync(XLSX_PATH), { type: 'buffer' })
const rows = XLSX.utils
  .sheet_to_json(wb.Sheets['工作表2'], { header: 1, defval: null })
  .slice(1)
  .filter((r) => r && r[0])

// spiritId 流水號（保留 1–99 給既有/測試帳號，名冊從 100 起）
let seq = 100
const usedEmails = new Set(Object.values(RESERVED).map((r) => r.email))
const churches = new Set()

// person registry：key → person
const people = new Map()
const teacherNameCount = new Map() // 偵測同名教師

function reservedFor(name) {
  return RESERVED[name] || null
}

function ensurePerson(key, realName) {
  if (people.has(key)) return people.get(key)
  const reserved = reservedFor(realName)
  let email, spiritId, reservedFlag = false
  if (reserved) {
    email = reserved.email
    spiritId = reserved.spiritId
    reservedFlag = true
  } else {
    spiritId = `PA26${pad4(seq++)}`
    email = `${spiritId.toLowerCase()}@${SYNTH_DOMAIN}`
    usedEmails.add(email)
  }
  const p = {
    key,
    realName,
    email,
    spiritId,
    roles: ['user'],
    teacherNo: null,
    phone: null,
    churchName: null,
    reserved: reservedFlag,
  }
  people.set(key, p)
  return p
}

// 1) 先建立教師（資料優先）
for (const r of rows) {
  const [no, nameRaw, unit, emailRaw, phoneRaw] = r
  const realName = cleanName(nameRaw)
  if (!realName) continue

  // 同名教師：第二筆起以編號區分 registry key，避免誤併
  const n = (teacherNameCount.get(realName) || 0) + 1
  teacherNameCount.set(realName, n)
  const key = n === 1 ? realName : `${realName}##${no}`

  const p = ensurePerson(key, realName)
  if (!p.roles.includes('teacher')) p.roles.push('teacher')
  p.teacherNo = cleanName(no)
  p.phone = phoneRaw ? String(phoneRaw).trim() : null

  // 教師 Email：採 Excel（去空白小寫），衝突則退回合成
  if (!p.reserved && emailRaw) {
    const e = String(emailRaw).trim().toLowerCase()
    if (e && !usedEmails.has(e) && /.+@.+\..+/.test(e)) {
      usedEmails.delete(p.email) // 釋放原合成 email
      p.email = e
      usedEmails.add(e)
    }
  }
  const ch = normChurch(unit)
  if (ch) {
    churches.add(ch)
    p.churchName = ch
  }
}

// 2) 建立課程與學員（每個非空班級欄一筆課程）
const courses = []
const enrolledKeys = new Set() // 出現在任何班級名單者
for (const r of rows) {
  const [no, nameRaw, , , , ...classCols] = r
  const teacherName = cleanName(nameRaw)
  // 找回該教師 key（同名以編號還原）
  let teacherKey = teacherName
  // 若該教師為同名第二筆，key 帶編號
  if (!people.has(teacherKey) || people.get(teacherKey).teacherNo !== cleanName(no)) {
    const alt = `${teacherName}##${no}`
    if (people.has(alt)) teacherKey = alt
  }

  classCols.forEach((cell, idx) => {
    if (!cell) return
    const names = String(cell)
      .split(',')
      .map((s) => cleanName(s))
      .filter(Boolean)
    if (names.length === 0) return
    const studentKeys = []
    for (const sName of names) {
      // 學員以姓名為鍵（與既有教師/學員合併）
      const sKey = sName
      ensurePerson(sKey, sName)
      studentKeys.push(sKey)
      enrolledKeys.add(sKey)
    }
    courses.push({
      teacherKey,
      teacherNo: cleanName(no),
      classIndex: idx + 1,
      title: `${teacherName} 的 啟動靈人（班級${idx + 1}）`,
      studentKeys,
    })
  })
}

// 3) 種子班：teacherNo A 開頭的教師 → 黃國倫啟動靈人種子班
const seedClassKeys = []
for (const p of people.values()) {
  if (p.roles.includes('teacher') && /^A/i.test(p.teacherNo || '') && !p.reserved) {
    seedClassKeys.push(p.key)
  }
}
const seedSet = new Set(seedClassKeys)

// 4) 對應不到的教師（不在任何班級名單中）→ 黃國倫收容班
//    與種子班重複者（A 開頭）剔除，僅保留非 A 開頭的未對應教師
const unmatchedTeacherKeys = []
for (const p of people.values()) {
  if (
    p.roles.includes('teacher') &&
    !enrolledKeys.has(p.key) &&
    !p.reserved &&
    !seedSet.has(p.key)
  ) {
    unmatchedTeacherKeys.push(p.key)
  }
}

// ── 輸出 ──
const churchList = [...churches].sort((a, b) => a.localeCompare(b, 'zh-Hant'))
const roster = {
  generatedAt: new Date().toISOString(),
  source: 'doc/啟動事工資料表_updated.xlsx',
  churches: churchList,
  people: [...people.values()],
  courses,
  seedClassKeys,
  unmatchedTeacherKeys,
}

writeFileSync(OUT_PATH, JSON.stringify(roster, null, 2), 'utf8')

// ── 統計 log ──
const teachers = roster.people.filter((p) => p.roles.includes('teacher'))
const studentsOnly = roster.people.filter((p) => !p.roles.includes('teacher'))
console.log('✅ roster.json 已產生：', OUT_PATH)
console.log('  教會:', churchList.length, '→', churchList.join(' | '))
console.log('  人員總數:', roster.people.length, '（教師', teachers.length, '/ 純學員', studentsOnly.length, '/ 含保留', roster.people.filter((p) => p.reserved).length, '）')
console.log('  課程數:', courses.length)
console.log('  種子班（teacherNo A 開頭）:', seedClassKeys.length)
console.log('  收容班（未對應且非 A，已剔除與種子班重複）:', unmatchedTeacherKeys.length)
const dupTeachers = [...teacherNameCount.entries()].filter(([, c]) => c > 1)
if (dupTeachers.length) console.log('  ⚠️ 同名教師（以編號區分）:', dupTeachers.map(([n, c]) => `${n}×${c}`).join(', '))
