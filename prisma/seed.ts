/*
 * ----------------------------------------------
 * 系統初始化腳本 - 建立系統管理員帳號
 * 2026-03-24
 * prisma/seed.ts
 * ----------------------------------------------
 */

import bcrypt from 'bcryptjs'
import { PrismaClient } from '../prisma/generated/prisma_client'
import { PrismaPg } from '@prisma/adapter-pg'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

const ADMIN_EMAIL = 'justin@blockcode.com.tw'
const ADMIN_NAME = '系統管理員'
const ADMIN_REAL_NAME = '系統管理員'
const ADMIN_NICKNAME = '管理員'
const ADMIN_SPIRIT_ID = 'PA000001'
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? 'Admin@1234'
const usingDefault = !process.env.SEED_ADMIN_PASSWORD

async function main() {
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12)

  await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    create: {
      email: ADMIN_EMAIL,
      name: ADMIN_NAME,
      realName: ADMIN_REAL_NAME,
      nickname: ADMIN_NICKNAME,
      spiritId: ADMIN_SPIRIT_ID,
      passwordHash,
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
  console.log(`  密碼來源 : ${usingDefault ? '預設值（Admin@1234）' : '環境變數 SEED_ADMIN_PASSWORD'}`)
  console.log('  ⚠️  首次登入後請立即變更密碼')
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
