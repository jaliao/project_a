## 1. 移除 auth.config.ts（Edge 分拆設定）

- [x] 1.1 確認 `auth.config.ts` 只被 `lib/auth.ts` 與 `middleware.ts` 引用
- [x] 1.2 刪除 `auth.config.ts`

## 2. 更新 lib/auth.ts

- [x] 2.1 移除 `import { authConfig } from '@/auth.config'`
- [x] 2.2 移除 `...authConfig` spread，將 `pages: { signIn: '/login', error: '/login' }` 直接寫入 NextAuth config

## 3. 改寫 middleware.ts（移除 NextAuth 依賴）

- [x] 3.1 移除 `import NextAuth from 'next-auth'` 與 `import { authConfig }` 相關引用
- [x] 3.2 改用 `req.cookies.get()` 判斷 session cookie 是否存在（同時檢查 `__Secure-authjs.session-token` 與 `authjs.session-token`）
- [x] 3.3 無 session cookie 時導向 `/login`，有 cookie 則放行（業務邏輯守衛保留在 RSC layout）
- [x] 3.4 移除已無用的 `NextRequest` 型別標注中的 NextAuth 相關欄位

## 4. 移除閒置的 Prisma 模型（Session、VerificationToken）

- [x] 4.1 從 `prisma/schema/user.prisma` 刪除 `model Session { ... }` 與 `model VerificationToken { ... }`
- [x] 4.2 從 `User` model 移除 `sessions Session[]` 關聯欄位
- [x] 4.3 執行 `make schema-update name=remove_unused_nextauth_tables` 產生 migration
- [x] 4.4 確認 migration SQL 只包含 `DROP TABLE sessions, verification_tokens`（不誤刪其他表）

## 5. 驗證

- [x] 5.1 `npm run build` 通過，無 Edge Runtime 相關錯誤或 `auth.config` import 錯誤
- [x] 5.2 本地測試：未登入時存取 `/dashboard` 正確導向 `/login`
- [x] 5.3 本地測試：登入後可正常進入 `/dashboard`，無迴圈重新導向
- [x] 5.4 本地測試：Onboarding 流程完整跑完（Step 1 → 2 → 3 → Dashboard）
- [x] 5.5 確認 DB 中 `sessions` 與 `verification_tokens` 表已移除
