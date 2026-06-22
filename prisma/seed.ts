/*
 * ----------------------------------------------
 * 系統初始化腳本 - 由名冊建立會員、課程、報名與教會
 * 2026-03-24 (Updated: 2026-06-05)
 * prisma/seed.ts
 *
 * 保留 101@iwillshare.org.tw（管理員）與 gordon@test.com（黃國倫）；
 * 其餘人員、課程、報名、教會皆來自 prisma/seed-data/roster.json
 * （由 build-roster.mjs 自 doc/啟動事工資料表_updated.xlsx 產生）。
 * ----------------------------------------------
 */

import bcrypt from 'bcryptjs'
import { PrismaClient } from '../prisma/generated/prisma_client'
import { PrismaPg } from '@prisma/adapter-pg'
import roster from './seed-data/roster.json'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

// ==========================================
// 保留帳號設定
// ==========================================
const ADMIN_EMAIL = '101@iwillshare.org.tw'
const ADMIN_NAME = '系統管理者'
const ADMIN_REAL_NAME = '系統管理者'
const ADMIN_NICKNAME = '系統管理者'
const ADMIN_PHONE = '0939123456'
const ADMIN_SPIRIT_ID = 'PA000001'
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? 'Admin@1234'
const usingDefaultAdmin = !process.env.SEED_ADMIN_PASSWORD

const STUDENT_PASSWORD = process.env.SEED_STUDENT_PASSWORD ?? 'Student@1234'
const usingDefaultStudent = !process.env.SEED_STUDENT_PASSWORD

// 測試帳號通訊 Email：統一設為已驗證，使外寄信集中收取（resolveContactEmail 規則）
const TEST_COMM_EMAIL = 'justin@blockcode.com.tw'

const GORDON = {
  email: 'gordon@test.com',
  name: '黃國倫',
  realName: '黃國倫',
  englishName: 'Gordon',
  nickname: 'Gordon',
  spiritId: 'PA260001',
  phone: '0912001001',
}

// 快照日期（課程開始 / 報名時間）
const SNAPSHOT_DATE = new Date('2026-06-05T00:00:00.000Z')
const COURSE_DATE = '2026/06/01'
const STARTER_CATALOG_ID = 1 // 啟動靈人

type RosterPerson = {
  key: string
  realName: string
  email: string
  spiritId: string
  roles: string[]
  teacherNo: string | null
  phone: string | null
  churchName: string | null
  reserved: boolean
}
type RosterCourse = {
  teacherKey: string
  teacherNo: string
  classIndex: number
  title: string
  studentKeys: string[]
}

async function main() {
  // ── 1. 系統管理員 ──────────────────────────
  const adminHash = await bcrypt.hash(ADMIN_PASSWORD, 12)
  await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    create: {
      email: ADMIN_EMAIL,
      name: ADMIN_NAME,
      realName: ADMIN_REAL_NAME,
      nickname: ADMIN_NICKNAME,
      gender: 'unspecified',
      displayNameMode: 'nickname_zh',
      spiritId: ADMIN_SPIRIT_ID,
      phone: ADMIN_PHONE,
      commEmail: TEST_COMM_EMAIL,
      isCommVerified: true,
      passwordHash: adminHash,
      roles: ['user', 'superadmin'],
      isTempPassword: false, // 已完成補填（realName/phone 齊備），跳過 onboarding 與 profile guard
    },
    // update 不覆寫 passwordHash 與 isTempPassword（維持冪等、不重置密碼）
    update: {
      roles: ['user', 'superadmin'],
      name: ADMIN_NAME,
      realName: ADMIN_REAL_NAME,
      nickname: ADMIN_NICKNAME,
      spiritId: ADMIN_SPIRIT_ID,
      phone: ADMIN_PHONE,
      commEmail: TEST_COMM_EMAIL,
      isCommVerified: true,
    },
  })

  // ── 2. 黃國倫（保留帳號）──────────────────────
  const studentHash = await bcrypt.hash(STUDENT_PASSWORD, 12)
  const gordon = await prisma.user.upsert({
    where: { email: GORDON.email },
    create: {
      email: GORDON.email,
      name: GORDON.name,
      realName: GORDON.realName,
      englishName: GORDON.englishName,
      nickname: GORDON.nickname,
      gender: 'male',
      displayNameMode: 'nickname_zh',
      spiritId: GORDON.spiritId,
      phone: GORDON.phone,
      commEmail: TEST_COMM_EMAIL,
      isCommVerified: true,
      passwordHash: studentHash,
      roles: ['user', 'teacher_1'],
      isTempPassword: true,
    },
    update: {
      name: GORDON.name,
      realName: GORDON.realName,
      englishName: GORDON.englishName,
      nickname: GORDON.nickname,
      spiritId: GORDON.spiritId,
      roles: ['user', 'teacher_1'],
      commEmail: TEST_COMM_EMAIL,
      isCommVerified: true,
    },
    select: { id: true },
  })

  console.log('✅ 保留帳號（管理員 + 黃國倫）初始化完成')
  console.log(`  管理員密碼來源：${usingDefaultAdmin ? '預設（Admin@1234）' : 'SEED_ADMIN_PASSWORD'}`)
  console.log(`  學員密碼來源：${usingDefaultStudent ? '預設（Student@1234）' : 'SEED_STUDENT_PASSWORD'}\n`)

  // ── 2b. 測試講師帳號（持有全部三個書籍講師身分，供 QA）──
  await prisma.user.upsert({
    where: { email: 'teacher@test.com' },
    create: {
      email: 'teacher@test.com',
      name: '測試講師',
      realName: '測試講師',
      nickname: '測試講師',
      gender: 'male',
      displayNameMode: 'nickname_zh',
      spiritId: 'PA269999',
      phone: '0912009999',
      commEmail: TEST_COMM_EMAIL,
      isCommVerified: true,
      passwordHash: studentHash,
      roles: ['user', 'teacher_1', 'teacher_2', 'teacher_3'],
      isTempPassword: false, // 已完成補填（realName/phone 齊備），跳過 onboarding 與 profile guard
    },
    update: {
      name: '測試講師',
      realName: '測試講師',
      nickname: '測試講師',
      spiritId: 'PA269999',
      roles: ['user', 'teacher_1', 'teacher_2', 'teacher_3'],
      commEmail: TEST_COMM_EMAIL,
      isCommVerified: true,
    },
  })
  console.log('✅ 測試講師帳號（teacher@test.com，三書講師身分）初始化完成\n')

  // ── 2c. 測試學員帳號（student1~4@test.com，已完成第一次登入補填，供 QA）──
  // 補填完成判定 = isTempPassword=false + realName + phone（見 onboarding-wizard / profile-completion-guard）
  // spiritId 採固定高位測試號段 PA26900X，與真實名冊號段隔開，且不納入 spiritIdCounter 計算
  const testStudents = Array.from({ length: 4 }, (_, idx) => {
    const i = idx + 1
    return {
      email: `student${i}@test.com`,
      name: `測試學員${i}`,
      nickname: `測試學員${i}`,
      spiritId: `PA26900${i}`,
      phone: `091200900${i}`,
    }
  })
  for (const s of testStudents) {
    await prisma.user.upsert({
      where: { email: s.email },
      create: {
        email: s.email,
        name: s.name,
        realName: s.name,
        nickname: s.nickname,
        gender: 'unspecified',
        displayNameMode: 'nickname_zh',
        spiritId: s.spiritId,
        phone: s.phone,
        commEmail: TEST_COMM_EMAIL,
        isCommVerified: true,
        passwordHash: studentHash,
        roles: ['user'],
        isTempPassword: false, // 已完成補填，登入後直接進 /dashboard
      },
      // update 不覆寫 passwordHash 與 isTempPassword（維持冪等、不重置密碼）
      update: {
        name: s.name,
        realName: s.name,
        nickname: s.nickname,
        spiritId: s.spiritId,
        roles: ['user'],
        commEmail: TEST_COMM_EMAIL,
        isCommVerified: true,
      },
    })
  }
  console.log('✅ 測試學員帳號（student1~4@test.com，已完成補填）初始化完成\n')

  // ── 3. 課程目錄（啟動靈人系列）──────────────────
  const courses = [
    { label: '啟動靈人', isActive: true, sortOrder: 1 },
    { label: '啟動豐盛', isActive: true, sortOrder: 2 },
    { label: '啟動得勝', isActive: false, sortOrder: 3 },
  ]
  for (const course of courses) {
    await prisma.courseCatalog.upsert({
      where: { id: course.sortOrder },
      create: course,
      update: { label: course.label, isActive: course.isActive },
    })
  }
  await prisma.courseCatalog.update({ where: { id: 1 }, data: { prerequisites: { set: [] } } })
  const prerequisiteMap = [
    { courseId: 2, prereqIds: [1] },
    { courseId: 3, prereqIds: [1, 2] },
  ]
  for (const { courseId, prereqIds } of prerequisiteMap) {
    await prisma.courseCatalog.update({
      where: { id: courseId },
      data: { prerequisites: { set: [], connect: prereqIds.map((id) => ({ id })) } },
    })
  }
  console.log('✅ 課程目錄初始化完成（啟動靈人 / 啟動豐盛 / 啟動得勝）\n')

  // ── 4. 教會清單（正規化後）──────────────────────
  const churchMap = new Map<string, number>()
  for (let i = 0; i < roster.churches.length; i++) {
    const name = roster.churches[i]
    const ch = await prisma.church.upsert({
      where: { name },
      create: { name, sortOrder: i + 1, isActive: true },
      update: { sortOrder: i + 1, isActive: true },
      select: { id: true },
    })
    churchMap.set(name, ch.id)
  }
  console.log(`✅ 教會清單初始化完成（${roster.churches.length} 間）：${roster.churches.join('、')}\n`)

  // ── 5. 名冊人員（教師 + 學員）批次建立 ──────────────
  const people = roster.people as RosterPerson[]
  // 名冊的講師皆為啟動靈人班別 → 將 'teacher' 對應為啟動靈人講師（teacher_1）
  const mapRosterRoles = (roles: string[]) =>
    roles.map((r) => (r === 'teacher' ? 'teacher_1' : r)) as (
      | 'user'
      | 'teacher_1'
      | 'teacher_2'
      | 'teacher_3'
      | 'admin'
      | 'superadmin'
    )[]
  await prisma.user.createMany({
    data: people.map((p) => ({
      email: p.email,
      name: p.realName,
      realName: p.realName,
      nickname: p.realName,
      spiritId: p.spiritId,
      phone: p.phone,
      passwordHash: studentHash,
      roles: mapRosterRoles(p.roles),
      teacherNo: p.teacherNo,
      isTempPassword: true,
      churchType: p.churchName ? 'church' : 'none',
      churchId: p.churchName ? churchMap.get(p.churchName) ?? null : null,
    })),
    skipDuplicates: true,
  })

  // 建立 email → id、key → email 對照
  const dbUsers = await prisma.user.findMany({
    where: { email: { in: people.map((p) => p.email) } },
    select: { id: true, email: true },
  })
  const emailToId = new Map(dbUsers.map((u) => [u.email, u.id]))
  const keyToEmail = new Map(people.map((p) => [p.key, p.email]))
  const keyToId = (key: string): string | undefined => {
    const email = keyToEmail.get(key)
    return email ? emailToId.get(email) : undefined
  }

  const teacherCount = people.filter((p) => p.roles.includes('teacher')).length
  console.log(`✅ 名冊人員初始化完成：${people.length} 人（教師 ${teacherCount} / 純學員 ${people.length - teacherCount}）\n`)

  // 教師 key 集合（用於判定「學員是否為老師」→ 發結業證書 / 全老師班結業）
  const teacherKeys = new Set(people.filter((p) => p.roles.includes('teacher')).map((p) => p.key))

  // 報名列：教師學員加 graduatedAt（啟動靈人結業證書）；所有報名皆繁體教材
  type EnrollmentRow = {
    inviteId: number
    userId: string
    status: 'approved'
    joinedAt: Date
    materialChoice: 'traditional'
    graduatedAt?: Date
  }
  const buildEnrollment = (inviteId: number, sKey: string, sid: string): EnrollmentRow => ({
    inviteId,
    userId: sid,
    status: 'approved',
    joinedAt: SNAPSHOT_DATE,
    materialChoice: 'traditional',
    ...(teacherKeys.has(sKey) ? { graduatedAt: SNAPSHOT_DATE } : {}),
  })

  // ── 6. 課程與報名（每個班級欄一筆課程）──────────────
  // 冪等守衛：以收容班為哨兵，已存在則跳過課程/報名建立（避免重跑重複建課）
  const CATCH_ALL_TITLE = '黃國倫 的 啟動靈人（收容班）'
  const alreadySeeded = await prisma.courseInvite.findFirst({
    where: { title: CATCH_ALL_TITLE },
    select: { id: true },
  })
  const enrollmentRows: EnrollmentRow[] = []
  let courseCreated = 0
  let firstInviteId: number | null = null
  for (const c of alreadySeeded ? [] : (roster.courses as RosterCourse[])) {
    const teacherId = keyToId(c.teacherKey)
    if (!teacherId) continue
    // 全老師班（至少 1 位學員且全為教師）→ 課程已結業
    const isAllTeacher = c.studentKeys.length > 0 && c.studentKeys.every((s) => teacherKeys.has(s))
    const invite = await prisma.courseInvite.create({
      data: {
        title: c.title,
        courseCatalogId: STARTER_CATALOG_ID,
        maxCount: Math.max(1, c.studentKeys.length),
        courseDate: COURSE_DATE,
        createdById: teacherId,
        startedAt: SNAPSHOT_DATE,
        ...(isAllTeacher ? { completedAt: SNAPSHOT_DATE } : {}),
      },
      select: { id: true },
    })
    courseCreated++
    if (firstInviteId === null) firstInviteId = invite.id
    for (const sKey of c.studentKeys) {
      const sid = keyToId(sKey)
      if (sid) enrollmentRows.push(buildEnrollment(invite.id, sKey, sid))
    }
  }

  // ── 7. 對應不到的教師 → 黃國倫收容課程（學員皆教師 → 已結業）──────────────
  const unmatched = roster.unmatchedTeacherKeys as string[]
  if (!alreadySeeded && unmatched.length > 0) {
    const catchAll = await prisma.courseInvite.create({
      data: {
        title: CATCH_ALL_TITLE,
        courseCatalogId: STARTER_CATALOG_ID,
        maxCount: unmatched.length,
        courseDate: COURSE_DATE,
        createdById: gordon.id,
        startedAt: SNAPSHOT_DATE,
        completedAt: SNAPSHOT_DATE,
      },
      select: { id: true },
    })
    courseCreated++
    if (firstInviteId === null) firstInviteId = catchAll.id
    for (const tKey of unmatched) {
      const tid = keyToId(tKey)
      if (tid) enrollmentRows.push(buildEnrollment(catchAll.id, tKey, tid))
    }
  }

  // ── 7b. 黃國倫結業報名（保留帳號不在名冊，另補一筆維持開課資格）──────────────
  if (!alreadySeeded && firstInviteId !== null) {
    enrollmentRows.push({
      inviteId: firstInviteId,
      userId: gordon.id,
      status: 'approved',
      joinedAt: SNAPSHOT_DATE,
      materialChoice: 'traditional',
      graduatedAt: SNAPSHOT_DATE,
    })
  }

  // 批次建立報名（唯一鍵 [inviteId,userId]）
  await prisma.inviteEnrollment.createMany({ data: enrollmentRows, skipDuplicates: true })
  const graduatedCount = enrollmentRows.filter((e) => e.graduatedAt).length
  console.log(`✅ 課程與報名初始化完成：課程 ${courseCreated} 筆、報名 ${enrollmentRows.length} 筆（含收容班 ${unmatched.length} 位教師）`)
  console.log(`   教材全繁體；結業報名 ${graduatedCount} 筆（教師學員 + 黃國倫）\n`)

  // ── 8. 同步 spiritIdCounter（避免與 generateSpiritId 衝突）──────
  const currentYear = new Date().getFullYear()
  const yy = currentYear % 100
  const prefix = `PA${String(yy).padStart(2, '0')}`
  let maxSeq = 1
  // 僅掃描名冊 people；測試帳號（PA269xxx 高位號段）刻意排除，避免計數器跳到 9999
  for (const p of people) {
    if (p.spiritId.startsWith(prefix)) {
      const n = parseInt(p.spiritId.slice(prefix.length), 10)
      if (!Number.isNaN(n) && n > maxSeq) maxSeq = n
    }
  }
  await prisma.spiritIdCounter.upsert({
    where: { year: currentYear },
    update: { seq: maxSeq },
    create: { year: currentYear, seq: maxSeq },
  })
  console.log(`✅ spiritIdCounter（${currentYear}）已設為 ${maxSeq}\n`)

  console.log('🎉 Seed 完成')
}

main()
  .catch((e) => {
    console.error('❌ Seed 執行失敗：', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
