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
            const needsUpdate: { spiritId?: string; realName?: string; nickname?: string } = {}
            if (!dbUser.spiritId) {
              needsUpdate.spiritId = await generateSpiritId()
            }
            if (!dbUser.realName && user.name) {
              needsUpdate.realName = user.name
            }
            if (!dbUser.nickname && user.name) {
              needsUpdate.nickname = user.name
            }
            if (Object.keys(needsUpdate).length > 0) {
              dbUser = await prisma.user.update({
                where: { id: dbUser.id },
                data: needsUpdate,
              })
            }
          }

          token.id = dbUser.id
          token.role = dbUser.role
          token.spiritId = dbUser.spiritId
          token.isTempPassword = dbUser.isTempPassword
        }
      } else if (token.id) {
        // 後續請求：從 DB 同步動態欄位，確保 role/spiritId 變更立即生效，無需重新登入
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { role: true, spiritId: true, isTempPassword: true },
        })
        if (dbUser) {
          token.role = dbUser.role
          token.spiritId = dbUser.spiritId
          token.isTempPassword = dbUser.isTempPassword
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
      }
      return session
    },
  },

  pages: {
    signIn: '/login',
    error: '/login',
  },
})
