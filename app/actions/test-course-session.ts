/*
 * ----------------------------------------------
 * Server Actions - 新增測試授課（僅限測試環境）
 * 2026-06-04
 * app/actions/test-course-session.ts
 *
 * 一鍵建立啟動靈人測試授課：
 * - 1 筆 CourseInvite（待開課、無教材訂購）
 * - 5 位動態建立的臨時測試 User
 * - 5 筆 approved 報名
 * production 環境直接拒絕（深度防禦）
 * ----------------------------------------------
 */

'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { generateSpiritId } from '@/lib/spirit-id'

type ActionResponse = {
  success: boolean
  message?: string
  data?: { inviteId: number }
}

const SPIRIT_COURSE_CATALOG_ID = 1 // 啟動靈人
const TEST_STUDENT_COUNT = 5

// ── 建立測試授課（啟動靈人 + 5 位臨時學員，教材未送出）──
export async function createTestCourseSession(): Promise<ActionResponse> {
  // 環境守衛：僅限非 production（不只靠 UI 隱藏）
  if (process.env.NODE_ENV === 'production') {
    return { success: false, message: '此功能僅供測試環境使用' }
  }

  const session = await auth()
  if (!session?.user?.id) return { success: false, message: '請先登入' }
  const createdById = session.user.id

  // 先核發 5 個 spiritId（generateSpiritId 自身含交易，於主交易前取得以降低巢狀複雜度）
  const spiritIds: string[] = []
  for (let i = 0; i < TEST_STUDENT_COUNT; i++) {
    spiritIds.push(await generateSpiritId())
  }

  // 以時間戳確保臨時 User 的 email 唯一、不與既有資料衝突
  const stamp = Date.now()

  const invite = await prisma.$transaction(async (tx) => {
    // CourseInvite：啟動靈人、maxCount=5、待開課（不設 startedAt）、不關聯 CourseOrder
    const createdInvite = await tx.courseInvite.create({
      data: {
        title: '測試授課 - 啟動靈人',
        courseCatalogId: SPIRIT_COURSE_CATALOG_ID,
        maxCount: TEST_STUDENT_COUNT,
        createdById,
      },
    })

    // 5 位臨時測試學員 + approved 報名（materialChoice = none）
    for (let i = 0; i < TEST_STUDENT_COUNT; i++) {
      const label = `測試學員${stamp}-${i}`
      const testUser = await tx.user.create({
        data: {
          email: `test-stu-${stamp}-${i}@test.local`,
          name: label,
          realName: label,
          spiritId: spiritIds[i],
        },
      })
      await tx.inviteEnrollment.create({
        data: {
          inviteId: createdInvite.id,
          userId: testUser.id,
          status: 'approved',
          materialChoice: 'none',
        },
      })
    }

    return createdInvite
  })

  // 重整本人個人頁授課清單
  if (session.user.spiritId) {
    revalidatePath(`/user/${session.user.spiritId.toLowerCase()}`)
  }

  return {
    success: true,
    message: `測試授課已建立（${TEST_STUDENT_COUNT} 位學員）`,
    data: { inviteId: invite.id },
  }
}
