/*
 * ----------------------------------------------
 * 系統初始化腳本 - 建立系統管理員與學員測試帳號
 * 2026-03-24 (Updated: 2026-04-02)
 * prisma/seed.ts
 * ----------------------------------------------
 */

import bcrypt from 'bcryptjs'
import { PrismaClient } from '../prisma/generated/prisma_client'
import { PrismaPg } from '@prisma/adapter-pg'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

// ==========================================
// 系統管理員設定
// ==========================================
const ADMIN_EMAIL = '101@iwillshare.org.tw'
const ADMIN_NAME = '系統管理員'
const ADMIN_REAL_NAME = '系統管理員'
const ADMIN_NICKNAME = '管理員'
const ADMIN_SPIRIT_ID = 'PA000001'
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? 'Admin@1234'
const usingDefaultAdmin = !process.env.SEED_ADMIN_PASSWORD

// ==========================================
// 學員測試帳號設定
// ==========================================
const STUDENT_PASSWORD = process.env.SEED_STUDENT_PASSWORD ?? 'Student@1234'
const usingDefaultStudent = !process.env.SEED_STUDENT_PASSWORD

type StudentSeed = {
  email: string
  name: string
  realName: string | null
  englishName: string | null
  nickname: string | null
  gender: 'male' | 'female' | 'unspecified'
  displayNameMode: 'chinese' | 'english'
  spiritId: string
  phone: string
}

const STUDENTS: StudentSeed[] = [
  // 1. 黃國倫 Gorden
  {
    email: 'gorden@test.com',
    name: '黃國倫',
    realName: '黃國倫',
    englishName: 'Gorden',
    nickname: 'Gorden',
    gender: 'male',
    displayNameMode: 'chinese',
    spiritId: 'PA260001',
    phone: '0912001001',
  },
  // 2. 吳容銘 Romen
  {
    email: 'romen@test.com',
    name: '吳容銘',
    realName: '吳容銘',
    englishName: 'Romen',
    nickname: 'Romen',
    gender: 'male',
    displayNameMode: 'chinese',
    spiritId: 'PA260002',
    phone: '0912001002',
  },
  // 3. Hilo（無中文名）
  {
    email: 'hilo@test.com',
    name: 'Hilo',
    realName: 'Hilo',
    englishName: 'Hilo',
    nickname: 'Hilo',
    gender: 'male',
    displayNameMode: 'english',
    spiritId: 'PA260003',
    phone: '0912001003',
  },
  // 4. Joyce（無中文名）
  {
    email: 'joyce@test.com',
    name: 'Joyce',
    realName: 'Joyce',
    englishName: 'Joyce',
    nickname: 'Joyce',
    gender: 'female',
    displayNameMode: 'english',
    spiritId: 'PA260004',
    phone: '0912001004',
  },
  // 5. 湯尼（無英文名）
  {
    email: 'tony@test.com',
    name: '湯尼',
    realName: '湯尼',
    englishName: 'Tony',
    nickname: '湯尼',
    gender: 'male',
    displayNameMode: 'chinese',
    spiritId: 'PA260005',
    phone: '0912001005',
  },
  // 6. Johni（無中文名）
  {
    email: 'johni@test.com',
    name: 'Johni',
    realName: null,
    englishName: 'Johni',
    nickname: null,
    gender: 'male',
    displayNameMode: 'english',
    spiritId: 'PA260006',
    phone: '0912001006',
  },
  // 7. KT（無中文名）
  {
    email: 'kt@test.com',
    name: 'KT',
    realName: null,
    englishName: 'KT',
    nickname: null,
    gender: 'male',
    displayNameMode: 'english',
    spiritId: 'PA260007',
    phone: '0912001007',
  },
  // 8. 王明台（無英文名）
  {
    email: 'wangmt@test.com',
    name: '王明台',
    realName: '王明台',
    englishName: null,
    nickname: null,
    gender: 'male',
    displayNameMode: 'chinese',
    spiritId: 'PA260008',
    phone: '0912001008',
  },
  // 9–13: 隨機測試帳號
  {
    email: 'member9@test.com',
    name: '李雅玲',
    realName: '李雅玲',
    englishName: null,
    nickname: '雅玲',
    gender: 'female',
    displayNameMode: 'chinese',
    spiritId: 'PA260009',
    phone: '0912001009',
  },
  {
    email: 'member10@test.com',
    name: '陳建文',
    realName: '陳建文',
    englishName: null,
    nickname: null,
    gender: 'male',
    displayNameMode: 'chinese',
    spiritId: 'PA260010',
    phone: '0912001010',
  },
  {
    email: 'member11@test.com',
    name: '林佳蓉',
    realName: '林佳蓉',
    englishName: null,
    nickname: '小蓉',
    gender: 'female',
    displayNameMode: 'chinese',
    spiritId: 'PA260011',
    phone: '0912001011',
  },
  {
    email: 'member12@test.com',
    name: '張家豪',
    realName: '張家豪',
    englishName: null,
    nickname: null,
    gender: 'male',
    displayNameMode: 'chinese',
    spiritId: 'PA260012',
    phone: '0912001012',
  },
  {
    email: 'member13@test.com',
    name: '黃淑芬',
    realName: '黃淑芬',
    englishName: null,
    nickname: '芬芬',
    gender: 'female',
    displayNameMode: 'chinese',
    spiritId: 'PA260013',
    phone: '0912001013',
  },
  // 14. Justin
  {
    email: 'justin@blockcode.com.tw',
    name: 'Justin',
    realName: '廖柏嘉',
    englishName: 'Justin',
    nickname: 'Justin',
    gender: 'male',
    displayNameMode: 'chinese',
    spiritId: 'PA260014',
    phone: '0912001014',
  },
  // 15–20: 隨機測試帳號
  {
    email: 'member15@test.com',
    name: '劉宗翰',
    realName: '劉宗翰',
    englishName: null,
    nickname: null,
    gender: 'male',
    displayNameMode: 'chinese',
    spiritId: 'PA260015',
    phone: '0912001015',
  },
  {
    email: 'member16@test.com',
    name: '許雅惠',
    realName: '許雅惠',
    englishName: null,
    nickname: '小惠',
    gender: 'female',
    displayNameMode: 'chinese',
    spiritId: 'PA260016',
    phone: '0912001016',
  },
  {
    email: 'member17@test.com',
    name: '吳宗育',
    realName: '吳宗育',
    englishName: null,
    nickname: null,
    gender: 'male',
    displayNameMode: 'chinese',
    spiritId: 'PA260017',
    phone: '0912001017',
  },
  {
    email: 'member18@test.com',
    name: '蔡佩君',
    realName: '蔡佩君',
    englishName: null,
    nickname: '佩君',
    gender: 'female',
    displayNameMode: 'chinese',
    spiritId: 'PA260018',
    phone: '0912001018',
  },
  {
    email: 'member19@test.com',
    name: '林威廷',
    realName: '林威廷',
    englishName: null,
    nickname: null,
    gender: 'male',
    displayNameMode: 'chinese',
    spiritId: 'PA260019',
    phone: '0912001019',
  },
  {
    email: 'member20@test.com',
    name: '王彥婷',
    realName: '王彥婷',
    englishName: null,
    nickname: null,
    gender: 'female',
    displayNameMode: 'chinese',
    spiritId: 'PA260020',
    phone: '0912001020',
  },
]

async function main() {
  // ── 建立系統管理員 ──────────────────────────
  const adminHash = await bcrypt.hash(ADMIN_PASSWORD, 12)

  await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    create: {
      email: ADMIN_EMAIL,
      name: ADMIN_NAME,
      realName: ADMIN_REAL_NAME,
      nickname: ADMIN_NICKNAME,
      spiritId: ADMIN_SPIRIT_ID,
      passwordHash: adminHash,
      role: 'superadmin',
      isTempPassword: true,
    },
    update: {
      // 不覆蓋 passwordHash，避免管理員已改密碼後被重置
      role: 'superadmin',
      name: ADMIN_NAME,
      realName: ADMIN_REAL_NAME,
      nickname: ADMIN_NICKNAME,
      spiritId: ADMIN_SPIRIT_ID,
    },
  })

  console.log('\n✅ 系統管理員帳號初始化完成')
  console.log('─────────────────────────────────')
  console.log(`  Email   : ${ADMIN_EMAIL}`)
  console.log(`  密碼來源 : ${usingDefaultAdmin ? '預設值（Admin@1234）' : '環境變數 SEED_ADMIN_PASSWORD'}`)
  console.log('  ⚠️  首次登入後請立即變更密碼')
  console.log('─────────────────────────────────\n')

  // ── 建立學員測試帳號 ────────────────────────
  const studentHash = await bcrypt.hash(STUDENT_PASSWORD, 12)

  await Promise.all(
    STUDENTS.map((student) =>
      prisma.user.upsert({
        where: { email: student.email },
        create: {
          email: student.email,
          name: student.name,
          realName: student.realName,
          englishName: student.englishName,
          nickname: student.nickname,
          gender: student.gender,
          displayNameMode: student.displayNameMode,
          spiritId: student.spiritId,
          phone: student.phone,
          passwordHash: studentHash,
          role: 'user',
          isTempPassword: true,
        },
        update: {
          // 不覆蓋 passwordHash，避免學員已改密碼後被重置
          name: student.name,
          realName: student.realName,
          englishName: student.englishName,
          nickname: student.nickname,
          gender: student.gender,
          displayNameMode: student.displayNameMode,
          spiritId: student.spiritId,
          phone: student.phone,
        },
      })
    )
  )

  console.log('✅ 學員測試帳號初始化完成')
  console.log('─────────────────────────────────')
  STUDENTS.forEach((s) => {
    const label = s.realName || s.englishName || s.name
    const nick = s.nickname ? `（${s.nickname}）` : ''
    console.log(`  ${s.spiritId}  ${label}${nick}  ${s.email}`)
  })
  console.log(`  密碼來源 : ${usingDefaultStudent ? '預設值（Student@1234）' : '環境變數 SEED_STUDENT_PASSWORD'}`)
  console.log('  ⚠️  首次登入後請立即變更密碼')
  console.log('─────────────────────────────────\n')

  // ── 初始化課程目錄 ──────────────────────────
  const courses = [
    { label: '啟動靈人', isActive: true, sortOrder: 1 },
    { label: '啟動豐盛', isActive: true, sortOrder: 2 },
    { label: '啟動靈人 3', isActive: false, sortOrder: 3 },
    { label: '啟動靈人 4', isActive: false, sortOrder: 4 },
  ]

  for (const course of courses) {
    await prisma.courseCatalog.upsert({
      where: { id: course.sortOrder },
      create: course,
      update: { label: course.label, isActive: course.isActive },
    })
  }

  // 確保入門課程（啟動靈人）先修列表為空
  await prisma.courseCatalog.update({
    where: { id: 1 },
    data: { prerequisites: { set: [] } },
  })

  // 設定先修關聯（累積式：每個課程需先修所有低編號課程）
  const prerequisiteMap: { courseId: number; prereqIds: number[] }[] = [
    { courseId: 2, prereqIds: [1] },
    { courseId: 3, prereqIds: [1, 2] },
    { courseId: 4, prereqIds: [1, 2, 3] },
  ]

  for (const { courseId, prereqIds } of prerequisiteMap) {
    await prisma.courseCatalog.update({
      where: { id: courseId },
      data: {
        prerequisites: {
          set: [],  // 先清空，確保幂等
          connect: prereqIds.map((id) => ({ id })),
        },
      },
    })
  }

  // ── 同步 spiritIdCounter（避免 generateSpiritId 與 seed 資料衝突）──────
  const currentYear = new Date().getFullYear()
  await prisma.spiritIdCounter.upsert({
    where: { year: currentYear },
    update: { seq: 20 },
    create: { year: currentYear, seq: 20 },
  })

  // ── 初始化教會/單位清單 ──────────────────────
  const churches = [
    { name: '101', sortOrder: 1 },
    { name: '心欣', sortOrder: 2 },
    { name: 'Kua', sortOrder: 3 },
    { name: '全福會', sortOrder: 4 },
  ]

  for (const church of churches) {
    await prisma.church.upsert({
      where: { name: church.name },
      create: { name: church.name, sortOrder: church.sortOrder, isActive: true },
      update: { sortOrder: church.sortOrder, isActive: true },
    })
  }

  console.log('✅ 教會/單位清單初始化完成')
  console.log('─────────────────────────────────')
  churches.forEach((c) => {
    console.log(`  ${c.sortOrder}. ${c.name}`)
  })
  console.log('─────────────────────────────────\n')

  console.log('✅ 課程目錄初始化完成')
  console.log('─────────────────────────────────')
  courses.forEach((c) => {
    console.log(`  ${c.label}（${c.isActive ? '開放' : '未開放'}）`)
  })
  console.log('─────────────────────────────────\n')
}

main()
  .catch((e) => {
    console.error('❌ Seed 執行失敗：', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
