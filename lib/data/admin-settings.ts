/*
 * ----------------------------------------------
 * Data Layer - 後台系統設定
 * 2026-04-02
 * lib/data/admin-settings.ts
 * ----------------------------------------------
 */

import { prisma } from '@/lib/prisma'

// 匯款帳號設定（教材繳費批價用）；測試環境預設值
export const REMITTANCE_ACCOUNT_KEY = 'remittance_account'
export const REMITTANCE_ACCOUNT_DEFAULT = '08-2345-6789'

export async function getAdminSetting(key: string, defaultValue: string): Promise<string> {
  const setting = await prisma.adminSetting.findUnique({ where: { key } })
  return setting?.value ?? defaultValue
}

export async function upsertAdminSetting(key: string, value: string): Promise<void> {
  await prisma.adminSetting.upsert({
    where: { key },
    create: { key, value },
    update: { value },
  })
}
