/*
 * ----------------------------------------------
 * NextAuth 認證設定
 * 2026-03-23
 * lib/auth.ts
 *
 * 支援：
 * - Google OAuth（現有）
 * - Credentials（Email + 密碼）
 * 首次 Google 登入自動建帳並核發 Spirit ID
 * JWT 寫入 isTempPassword、spiritId、role
 * ----------------------------------------------
 */

import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'
import Credentials from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@auth/prisma-adapter'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'
import { generateSpiritId } from './spirit-id'

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 天
  },

  providers: [
    // ── Google OAuth ──────────────────────────
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),

    // ── Email + 密碼登入 ─────────────────────
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: '密碼', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        })

        if (!user || !user.passwordHash) return null

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        )

        if (!isValid) return null

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        }
      },
    }),
  ],

  callbacks: {
    // ── JWT：寫入自定義欄位，並補核 Google 首次登入所需資料 ──
    async jwt({ token, user, account }) {
      if (user) {
        // 初次登入時 user 物件存在，從 DB 取最新資料
        let dbUser = await prisma.user.findUnique({
          where: { id: user.id as string },
        })
        if (dbUser) {
          // Google OAuth：補核 spiritId 與姓名（jwt 為唯一寫入點，避免 race condition）
          if (account?.provider === 'google') {
            // spiritId：分開處理，帶重試避免計數器與現有資料不同步時的 unique 衝突
            if (!dbUser.spiritId) {
              for (let attempt = 0; attempt < 5; attempt++) {
                const candidate = await generateSpiritId()
                try {
                  await prisma.user.updateMany({
                    where: { id: dbUser.id, spiritId: null },
                    data: { spiritId: candidate },
                  })
                  break // 成功，跳出重試迴圈
                } catch (e: unknown) {
                  const isUniqueViolation =
                    typeof e === 'object' && e !== null &&
                    'code' in e && (e as { code: string }).code === 'P2002'
                  if (!isUniqueViolation || attempt === 4) throw e
                  // unique 衝突：計數器與現有資料不同步，重試
                }
              }
              // 重新讀取確保取得最新 spiritId
              const refreshed = await prisma.user.findUnique({ where: { id: dbUser.id } })
              if (refreshed) dbUser = refreshed
            }

            // realName / nickname：獨立更新，不混入 spiritId 避免整批失敗
            const nameUpdates: { realName?: string; nickname?: string } = {}
            if (!dbUser.realName && user.name) nameUpdates.realName = user.name
            if (!dbUser.nickname && user.name) nameUpdates.nickname = user.name
            if (Object.keys(nameUpdates).length > 0) {
              dbUser = await prisma.user.update({
                where: { id: dbUser.id },
                data: nameUpdates,
              })
            }
          }

          token.id = dbUser.id
          token.role = dbUser.role
          token.spiritId = dbUser.spiritId
          token.isTempPassword = dbUser.isTempPassword
          token.isProfileComplete = !!(dbUser.realName && dbUser.phone)
        }
      } else if (token.id) {
        // 後續請求：從 DB 同步動態欄位，確保 role/spiritId 變更立即生效，無需重新登入
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { role: true, spiritId: true, isTempPassword: true, realName: true, phone: true },
        })
        if (dbUser) {
          token.role = dbUser.role
          token.spiritId = dbUser.spiritId
          token.isTempPassword = dbUser.isTempPassword
          token.isProfileComplete = !!(dbUser.realName && dbUser.phone)
        }
      }
      return token
    },

    // ── Session：將 token 欄位暴露給前端 ────────
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.spiritId = token.spiritId as string | null
        session.user.isTempPassword = token.isTempPassword as boolean
        session.user.isProfileComplete = token.isProfileComplete as boolean ?? false
      }
      return session
    },
  },

  pages: {
    signIn: '/login',
    error: '/login',
  },
})
