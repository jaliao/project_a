/*
 * ----------------------------------------------
 * ESLint Flat Config（ESLint 9 + Next.js 16）
 * 2026-06-23
 * eslint.config.mjs
 * ----------------------------------------------
 */

import nextCoreWebVitals from 'eslint-config-next/core-web-vitals'
import nextTypescript from 'eslint-config-next/typescript'

const config = [
  // 忽略產生物與相依目錄
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'prisma/generated/**',
      'next-env.d.ts',
    ],
  },
  ...nextCoreWebVitals,
  ...nextTypescript,
]

export default config
