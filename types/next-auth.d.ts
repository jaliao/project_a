/*
 * ----------------------------------------------
 * NextAuth Session 型別擴充
 * 2026-03-23
 * types/next-auth.d.ts
 * ----------------------------------------------
 */

import { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role: string
      spiritId: string | null
      isTempPassword: boolean
    } & DefaultSession['user']
  }
}
