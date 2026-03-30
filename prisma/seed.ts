/*
 * ----------------------------------------------
 * 系統初始化腳本 - 建立系統管理員與學員測試帳號
 * 2026-03-24 (Updated: 2026-03-24)
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
const ADMIN_EMAIL = 'justin@blockcode.com.tw'
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

const STUDENTS = [
  {
    email: 'student1@test.com',
    name: '陳志明',
    realName: '陳志明',
    nickname: '小明',
    spiritId: 'PA260001',
    phone: '0912-001-001',
  },
  {
    email: 'student2@test.com',
    name: '林雅婷',
    realName: '林雅婷',
    nickname: '婷婷',
    spiritId: 'PA260002',
    phone: '0923-002-002',
  },
  {
    email: 'student3@test.com',
    name: '王建宏',
    realName: '王建宏',
    nickname: '阿宏',
    spiritId: 'PA260003',
    phone: '0934-003-003',
  },
  {
    email: 'student4@test.com',
    name: '張淑惠',
    realName: '張淑惠',
    nickname: '小惠',
    spiritId: 'PA260004',
    phone: '0956-004-004',
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
          ...student,
          passwordHash: studentHash,
          role: 'user',
          isTempPassword: true,
        },
        update: {
          // 不覆蓋 passwordHash，避免學員已改密碼後被重置
          name: student.name,
          realName: student.realName,
          nickname: student.nickname,
          spiritId: student.spiritId,
          phone: student.phone,
        },
      })
    )
  )

  console.log('✅ 學員測試帳號初始化完成')
  console.log('─────────────────────────────────')
  STUDENTS.forEach((s) => {
    console.log(`  ${s.spiritId}  ${s.realName}（${s.nickname}）  ${s.email}`)
  })
  console.log(`  密碼來源 : ${usingDefaultStudent ? '預設值（Student@1234）' : '環境變數 SEED_STUDENT_PASSWORD'}`)
  console.log('  ⚠️  首次登入後請立即變更密碼')
  console.log('─────────────────────────────────\n')

  // ── 初始化課程目錄 ──────────────────────────
  const courses = [
    { label: '啟動靈人 1', isActive: true, sortOrder: 1 },
    { label: '啟動靈人 2', isActive: true, sortOrder: 2 },
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

  // 設定先修關聯（id 2 先修 1，3 先修 2，4 先修 3）
  const prerequisiteMap = [
    { courseId: 2, prereqId: 1 },
    { courseId: 3, prereqId: 2 },
    { courseId: 4, prereqId: 3 },
  ]

  for (const { courseId, prereqId } of prerequisiteMap) {
    await prisma.courseCatalog.update({
      where: { id: courseId },
      data: {
        prerequisites: {
          connect: { id: prereqId },
        },
      },
    })
  }

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
