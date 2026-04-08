## Context

目前認證架構為了讓 `middleware.ts` 跑在 Edge Runtime，將 NextAuth 設定拆成兩份：
- `auth.config.ts`：Edge 相容版，JWT callback 不查 DB，直接 pass-through token
- `lib/auth.ts`：完整版，spread `authConfig` 後加入 Prisma / bcrypt / DB 同步邏輯

這個分拆造成 middleware 讀到的 `isTempPassword` / `isProfileComplete` 可能是過期的 JWT 值，引發路由守衛錯誤。正確的修法是讓 middleware 完全不依賴 NextAuth，改為輕量 cookie 判斷，所有有狀態的守衛交由 RSC 層（`(user)/layout.tsx`）的完整版 `auth()` 負責。

## Goals / Non-Goals

**Goals:**
- 刪除 `auth.config.ts`，消除兩份設定並存的維護成本
- `middleware.ts` 只做「是否有 session cookie」的輕量判斷，不依賴 NextAuth
- `lib/auth.ts` 回歸單一完整設定，移除 `...authConfig` spread
- 所有業務邏輯守衛（`isTempPassword`、`isProfileComplete`）保留在 RSC layout，永遠讀 DB 最新值

**Non-Goals:**
- 不修改 JWT 結構或 session 欄位
- 不修改 DB schema
- 不改動登入 / 登出 / OAuth 流程
- 不在 middleware 做簽章驗證（RSC 層負責完整驗證）

## Decisions

### D1：middleware 改為 cookie presence 判斷，不 import NextAuth

**選擇**：直接讀 `req.cookies.get('authjs.session-token')`，有 cookie 視為已登入，無 cookie 視為未登入，導向 `/login`。

**理由**：
- 完全不需要 NextAuth、Prisma 或任何外部套件，middleware 保持輕量
- NextAuth 5 的 session cookie 名稱為 `authjs.session-token`（開發）/ `__Secure-authjs.session-token`（HTTPS），可直接讀取
- 輕量判斷的安全性由 RSC 層補足：`(user)/layout.tsx` 呼叫完整版 `auth()`，驗證 JWT 簽章並讀 DB，偽造 cookie 無法通過 RSC 守衛

**替代方案考慮**：
- `next-auth/jwt` 的 `getToken()`：可做簽章驗證，但仍有 Edge/Node 相容問題，且過度複雜
- 保留 Edge NextAuth：維持現狀的根本問題，不考慮
- 完全移除 middleware：未登入用戶會先觸發 RSC 渲染才被導向，UX 略差且不必要

### D2：lib/auth.ts 移除 `...authConfig` spread，inline 設定

**選擇**：將 `authConfig` 中的 `pages` 設定直接寫入 `lib/auth.ts`，刪除 `auth.config.ts`。

**理由**：單一設定來源，減少認知負擔，避免兩份設定不同步的風險。

### D3：生產環境 cookie 名稱處理

NextAuth 5 在 HTTPS 環境下 cookie 名稱為 `__Secure-authjs.session-token`，開發環境為 `authjs.session-token`。

**選擇**：middleware 同時檢查兩個 cookie 名稱：
```typescript
const sessionCookie =
  req.cookies.get('__Secure-authjs.session-token') ??
  req.cookies.get('authjs.session-token')
```

## Risks / Trade-offs

- **Cookie 過期但未清除** → 使用者持有過期 cookie 仍能通過 middleware，但 RSC 層的 `auth()` 會驗證失敗並導向 `/login`。風險可接受。
- **Cookie 名稱隨 NextAuth 版本異動** → 升級 NextAuth 時需確認 cookie 名稱。在 `middleware.ts` 集中管理，易於維護。
- **middleware 不做簽章驗證** → 攻擊者偽造 cookie 可繞過 middleware，但無法繞過 RSC 層的完整 JWT 驗證。縱深防禦仍完整。

## Migration Plan

1. 更新 `lib/auth.ts`：移除 `...authConfig`，inline `pages` 設定
2. 刪除 `auth.config.ts`
3. 重寫 `middleware.ts`：移除 NextAuth import，改為 cookie presence 判斷
4. 確認 `(user)/layout.tsx` 守衛邏輯完整（已於 cr-spec-260408-002 完成）
5. `npm run build` 驗證無 Edge Runtime 相關錯誤

Rollback：還原三個檔案即可，無 DB migration。

## Open Questions

（無）
