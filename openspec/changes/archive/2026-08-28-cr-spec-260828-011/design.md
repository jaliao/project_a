## Context

`lib/auth.ts`（NextAuth v5 / Auth.js，`session.strategy = 'jwt'`，`maxAge` 30 天）的 jwt callback：

```ts
async jwt({ token, user, account }) {
  if (user) {
    // 初次登入：用 user.id 查 DB，設 token.id/roles/spiritId/...
  } else if (token.id) {
    // 後續請求：用 token.id 查 DB 同步動態欄位
    const dbUser = await prisma.user.findUnique({ where: { id: token.id as string }, select: {...} })
    if (dbUser) {
      token.roles = dbUser.roles
      // ... 同步 spiritId / isTempPassword / isProfileComplete / email / avatarUrl
    }
    // ⚠️ dbUser 為 null 時：無 else，原 token 原封不動返回
  }
  return token
}
```

相關既有行為：

- `session` callback 把 `token.id` 塞進 `session.user.id`。
- `middleware.ts` 判定「已登入」**只看 cookie 是否存在**（`__Secure-authjs.session-token` / `authjs.session-token`），不解 JWT。
- `app/[locale]/(user)/layout.tsx`：`const session = await auth()`；`session?.user?.id` falsy → `redirect('/login')`。`(admin)` layout 在其之上再加 `canAccessAdmin`。
- 暫停會員走另一條路徑（`signIn` callback 擋登入 + layout 即時查 `suspendedAt` → `redirect('/api/suspended-logout')`），與本 change 無關。

「殭屍 session」成因：`token.id` 指向已不存在的 `users` row（本機 dev 重建 DB、帳號被硬刪、跨環境共用的舊 cookie），jwt callback 不清理 → `auth()` 持續回傳帶失效 id 的 session。

## Goals / Non-Goals

**Goals：**
- `token.id` 確定查無使用者時，jwt session 失效，受保護頁面／動作把使用者導回登入頁。
- DB 查詢暫時失敗時**不**把使用者登出（避免 DB 抖動造成全站被踢）。

**Non-Goals：**
- 不改 middleware 的 cookie-only 快速判定（維持「middleware 輕量、layout 為真正守衛」的既有分層）。
- 不改初次登入分支、`signIn` callback、layout、暫停會員流程。
- 不主動在 response 清除 cookie（NextAuth 於後續 auth 流程自行處理；layout 導向 `/login` 已達成使用者體感的「踢出」）。
- 不新增「帳號刪除時主動撤銷所有 session」機制（JWT 無伺服器端 session store，超出範圍）。

## Decisions

### 1. `dbUser === null` → `return null`

Auth.js v5 的 jwt callback 回傳 `null` 即「使 JWT session 失效」（官方語意）。相較回傳 `{}`（空 token），`return null` 讓 `auth()` 直接得到「無 session」，不會殘留「有 session 物件但 `user.id` 為 undefined」的半殘狀態。

```ts
} else if (token.id) {
  let dbUser
  try {
    dbUser = await prisma.user.findUnique({
      where: { id: token.id as string },
      select: { /* 現有欄位 */ },
    })
  } catch (e) {
    console.error('[auth] jwt callback 查詢使用者失敗（保留現有 token）:', e)
    return token
  }

  if (!dbUser) {
    // token.id 指向不存在的使用者（DB 重建 / 帳號已刪 / 舊 cookie）→ 使 session 失效
    console.warn('[auth] token.id 對應的使用者不存在，session 失效:', token.id)
    return null
  }

  token.roles = dbUser.roles
  token.spiritId = dbUser.spiritId
  token.isTempPassword = dbUser.isTempPassword
  token.isProfileComplete = !!(dbUser.realName && dbUser.phone)
  token.email = dbUser.email
  token.avatarUrl = resolveAvatarUrl(dbUser)
}
return token
```

型別：Auth.js `JWT` callback 回傳型別在 v5 已允許 `null`；若 TS 抱怨，回傳 `null as unknown as JWT` 前優先確認 `next-auth` 版本型別定義（多數 v5 版本直接支援 `JWT | null`）。

### 2. try/catch 只包 `findUnique`，例外時保留 token

DB 連線瞬斷時，若不 catch → jwt callback throw → 該請求 500；若把 throw 當「查無」而 `return null` → DB 抖動期間所有在線使用者被登出。故：**只有查詢成功且結果為 `null`** 才 `return null`；查詢本身失敗 → `console.error` + `return token`（沿用舊值，下次請求再同步）。這與既有「同步失敗不阻斷」的風格一致（見 `signIn` callback 更新登入時間的 try/catch）。

### 3. 不動 middleware

`middleware.ts` 只檢查 cookie 是否存在，session 失效後 cookie 可能還在 → middleware 仍放行。但 `(user)` / `(admin)` layout 的 `auth()` 會得到 `null` → `redirect('/login')`，Server Actions 各自的 `if (!session?.user?.id)` 也會擋下。middleware 那層的即時性不是本 change 目標（既有設計即「middleware 快篩、layout 守門」），且 cookie 會在後續 `/api/auth/*` 流程被 NextAuth 清除。

## Risks / Trade-offs

- **[風險] 誤把有效使用者登出**：僅當 `findUnique` 成功回傳 `null` 才失效；DB 錯誤有 try/catch 保護。role/spiritId 變更、暫停會員等既有情境 `dbUser` 都存在，不受影響。
- **[風險] Auth.js 版本對 `return null` 的支援**：v5（Auth.js）標準行為即「return null → invalidate」。apply 時以本機 dev 實測確認（過期 cookie → 下一個受保護請求被導 `/login`）。
- **[取捨] middleware 不即時擋**：接受——受保護內容仍被 layout 擋下，未洩漏；體感上使用者仍是「被導回登入頁」。

## Migration Plan

1. `lib/auth.ts`：改 jwt callback `else if (token.id)` 分支（try/catch + `dbUser === null` → `return null`）。
2. `npm run lint` + `npm run build` + `npx tsc --noEmit`。
3. 本機 dev 手動驗證：
   - 正常登入 → 正常瀏覽、Server Action 正常。
   - 模擬失效 session（改 DB 該 user id，或用重建前的舊 cookie）→ 下一個 `(user)` 頁面請求被導 `/login`；重新登入後恢復。
   - 停掉 DB 連線一次 → 請求不 500、不被登出（沿用舊 token）。
4. `config/version.json` patch +1、`updatedAt`。

**Rollback**：單檔約 10 行變更，revert commit 即可；無資料異動。
