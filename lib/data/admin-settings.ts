/*
 * ----------------------------------------------
 * Data Layer - 後台系統設定
 * 2026-04-02
 * lib/data/admin-settings.ts
 * ----------------------------------------------
 */

import { prisma } from '@/lib/prisma'

// 匯款帳號資訊設定（教材繳費批價用，多行文字）；測試環境預設值
export const REMITTANCE_ACCOUNT_KEY = 'remittance_account'
export const REMITTANCE_ACCOUNT_DEFAULT = `第一銀行淡水分行
戶名：希望之聲文化有限公司
銀行代碼：007
帳號：218-10-002087`

// 班級人數上限（開課/編輯課程之一般使用者上限；管理者可覆寫超過）
export const CLASS_MAX_CAPACITY_KEY = 'class_max_capacity'
export const CLASS_MAX_CAPACITY_DEFAULT = '7'
// 防呆硬頂（管理者亦不得超過此值）
export const CLASS_MAX_CAPACITY_HARD_CAP = 999

// 結業信範本（主旨／內文）；支援變數 {{studentName}} {{courseName}} {{graduationDate}} {{spiritId}}
export const GRADUATION_EMAIL_SUBJECT_KEY = 'graduation_email_subject'
export const GRADUATION_EMAIL_BODY_KEY = 'graduation_email_body'
export const GRADUATION_EMAIL_SUBJECT_DEFAULT = '【啟動事工】恭喜您完成「{{courseName}}」結業'
export const GRADUATION_EMAIL_BODY_DEFAULT = `親愛的 {{studentName}}，您好：

恭喜您於 {{graduationDate}} 完成「{{courseName}}」課程結業！

您的啟動事工編號（靈人編號）為 {{spiritId}}。
願您持續在這條道路上前行，將所學祝福更多人。

啟動事工 敬上`

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
