/*
 * ----------------------------------------------
 * NextAuth 認證設定
 * 2026-03-23 (Updated: 2026-10-21)
 * lib/auth.ts
 *
 * 支援：
 * - Google OAuth（現有）
 * - LINE OAuth（cr-feat-261021-004）
 * - Credentials（Email/帳號代碼 + 密碼）
 * 首次 Google/LINE 登入自動建帳並核發 Spirit ID；
 * 建帳號當下即一併衍生 loginHandle（見自訂 adapter.createUser），避免 NOT NULL 約束空窗期
 * JWT 寫入 isTempPassword、spiritId、roles（多重身分）
 * ----------------------------------------------
 */

import NextAuth from 'next-auth'
import type { Adapter } from 'next-auth/adapters'
import Google from 'next-auth/providers/google'
import Line from 'next-auth/providers/line'
import Credentials from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@auth/prisma-adapter'
import bcrypt from 'bcryptjs'
import { resolveAvatarUrl } from '@/lib/utils/avatar'
import { prisma } from './prisma'
import { generateSpiritId, deriveLoginHandle } from './spirit-id'

// 建帳號（Google／LINE OAuth 首次登入）時，NextAuth adapter 只會帶 OAuth profile 本有的欄位
// （email／name／image）直接 INSERT；spiritId／loginHandle 需在同一次 create 一併補上，
// 否則 loginHandle 的 NOT NULL 約束會讓這次 INSERT 直接失敗
const prismaAdapter = PrismaAdapter(prisma)
const adapter: Adapter = {
  ...prismaAdapter,
  async createUser(data) {
    const spiritId = await generateSpiritId()
    const merged = { ...data, spiritId, loginHandle: deriveLoginHandle(spiritId) }
    return prismaAdapter.createUser!(merged)
  },
}

// 對外是否走 HTTPS（透過 Cloudflare Tunnel 對外時為 true）
// 代理後容器內部為 http，請求協定判斷不可靠，故改以公開 URL 協定為準，
// 確保 PKCE/session cookie 的 secure 旗標與 __Secure- 前綴在設定/讀取時一致。
const useSecureCookies = (process.env.NEXTAUTH_URL ?? '').startsWith('https://')

export const { handlers, auth, signIn, signOut } = NextAuth({
  // 顯式釘住 secret，避免 dev 熱重載產生臨時 secret 導致 PKCE cookie 解密失敗
  secret: process.env.NEXTAUTH_SECRET,
  // 信任反向代理（Cloudflare Tunnel）轉發的 Host/Proto，正確組出 callback URL
  trustHost: true,
  useSecureCookies,

  pages: {
    signIn: '/login',
    error: '/login',
  },

  adapter,

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

    // ── LINE OAuth（cr-feat-261021-004）────────
    // 不設 allowDangerousEmailAccountLinking：LINE 的 email 不保證存在，
    // 自動以 email 連結既有帳號有帳號接管風險（見 design.md D3）
    Line({
      clientId: process.env.LINE_CLIENT_ID!,
      clientSecret: process.env.LINE_CLIENT_SECRET!,
    }),

    // ── Email/帳號代碼 + 密碼登入 ───────────────
    Credentials({
      name: 'credentials',
      credentials: {
        identifier: { label: 'Email 或帳號代碼', type: 'text' },
        password: { label: '密碼', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.identifier || !credentials?.password) return null

        const identifier = (credentials.identifier as string).trim().toLowerCase()
        const user = await prisma.user.findFirst({
          where: { OR: [{ email: identifier }, { loginHandle: identifier }] },
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
    // ── 登入守衛：被暫停會員禁止登入（Credentials 與 Google 皆適用）──
    async signIn({ user }) {
      const where = user?.id
        ? { id: user.id as string }
        : user?.email
          ? { email: user.email }
          : null
      if (where) {
        const u = await prisma.user.findUnique({
          where,
          select: { id: true, suspendedAt: true, mergedIntoId: true },
        })
        if (u?.suspendedAt) return '/account-suspended'
        if (u?.mergedIntoId) return '/account-merged'

        // 記錄登入時間：先把舊的 lastLoginAt 平移至 previousLoginAt，再更新為當下時間。
        // 以原子 SQL 做欄位對欄位賦值，避免同帳號併發登入的競態；
        // 失敗僅記錄、不阻斷登入（活躍度紀錄非登入關鍵路徑）。
        if (u?.id) {
          try {
            await prisma.$executeRaw`
              UPDATE "users"
              SET "previousLoginAt" = "lastLoginAt", "lastLoginAt" = NOW()
              WHERE id = ${u.id}::uuid
            `
          } catch (e) {
            console.error('[auth] 更新登入時間失敗（不阻斷登入）:', e)
          }
        }
      }
      return true
    },

    // ── JWT：寫入自定義欄位，並補核 Google 首次登入所需資料 ──
    async jwt({ token, user, account }) {
      if (user) {
        // 初次登入時 user 物件存在，從 DB 取最新資料
        let dbUser = await prisma.user.findUnique({
          where: { id: user.id as string },
        })
        if (dbUser) {
          // Google／LINE OAuth：補核 spiritId 與姓名（jwt 為唯一寫入點，避免 race condition）
          // 注：新帳號的 spiritId／loginHandle 已在 adapter.createUser 當場寫入，
          // 這裡的 spiritId 重試邏輯僅為既有資料的防呆（理論上不會再觸發）
          if (account?.provider === 'google' || account?.provider === 'line') {
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

            // 代填學員邀請自動連結（cr-feat-261022-003）：以受邀 email 登入（Google 透過
            // allowDangerousEmailAccountLinking 自動關聯到此既有帳號）時解除代填狀態，
            // 獨立判斷、不混入上方 spiritId/姓名重試邏輯，各自失敗不互相影響
            if (dbUser.isProxyMember) {
              dbUser = await prisma.user.update({
                where: { id: dbUser.id },
                data: { isProxyMember: false },
              })
            }
          }

          token.id = dbUser.id
          token.roles = dbUser.roles
          token.spiritId = dbUser.spiritId
          token.isTempPassword = dbUser.isTempPassword
          token.isProfileComplete = !!(dbUser.realName && dbUser.phone)
          token.avatarUrl = resolveAvatarUrl(dbUser)
        }
      } else if (token.id) {
        // 後續請求：從 DB 同步動態欄位，確保 role/spiritId 變更立即生效，無需重新登入
        let dbUser
        try {
          dbUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: {
              roles: true,
              spiritId: true,
              isTempPassword: true,
              realName: true,
              phone: true,
              email: true,
              avatarKey: true,
              image: true,
            },
          })
        } catch (e) {
          // DB 連線瞬斷等：不誤把使用者登出，沿用既有 token，待下次請求再同步
          console.error('[auth] jwt callback 查詢使用者失敗（保留現有 token）:', e)
          return token
        }

        if (!dbUser) {
          // token.id 指向不存在的使用者（開發環境重建 DB／帳號已刪／跨環境舊 cookie）
          // → 使 JWT session 失效，下一個受保護請求即被 layout 導回 /login，不留殭屍 session
          console.warn('[auth] token.id 對應的使用者不存在，session 失效:', token.id)
          return null
        }

        token.roles = dbUser.roles
        token.spiritId = dbUser.spiritId
        token.isTempPassword = dbUser.isTempPassword
        token.isProfileComplete = !!(dbUser.realName && dbUser.phone)
        // 帳號 email 變更後同步（顯示一致性；授權皆以 id/roles）
        token.email = dbUser.email
        token.avatarUrl = resolveAvatarUrl(dbUser)
      }
      return token
    },

    // ── Session：將 token 欄位暴露給前端 ────────
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.roles = (token.roles as string[]) ?? []
        session.user.spiritId = token.spiritId as string | null
        session.user.isTempPassword = token.isTempPassword as boolean
        session.user.isProfileComplete = token.isProfileComplete as boolean ?? false
        session.user.avatarUrl = (token.avatarUrl as string | null) ?? null
      }
      return session
    },
  },
})
