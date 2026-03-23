/*
 * ----------------------------------------------
 * NextAuth Route Handler
 * 2026-03-23
 * app/api/auth/[...nextauth]/route.ts
 * ----------------------------------------------
 */

import { handlers } from '@/lib/auth'

export const { GET, POST } = handlers
