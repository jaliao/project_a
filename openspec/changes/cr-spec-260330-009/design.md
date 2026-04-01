## Context

目前系統有三個缺口：
1. `/register` 頁只有 Email 表單，無 Google OAuth 入口，且 UI 風格與 `/login` 不一致
2. Profile 頁「連結帳號 → Google」按鈕是 `disabled` stub
3. `auth.ts` 未設定 `allowDangerousEmailAccountLinking`，導致 Email 帳號嘗試用 Google OAuth 登入時，NextAuth 預設不合併帳號

NextAuth v5 + PrismaAdapter 的帳號連動機制：當 Google OAuth 的 email 與現有 User 的 email 吻合時，若 Provider 設有 `allowDangerousEmailAccountLinking: true`，Adapter 會自動將 Google Account 記錄關聯至現有 User，不建立新帳號。

## Goals / Non-Goals

**Goals:**
- `/register` 頁加入 Google OAuth 按鈕，UI 統一為 shadcn 兩欄版型
- Profile「連結帳號」按鈕啟用，觸發 Google OAuth 完成後自動連動
- Google email 與系統帳號 email 相同時，連動成功

**Non-Goals:**
- 不支援 Google email 與系統帳號 email 不同的跨信箱連動（留 Open Question）
- 不處理 LINE 連動（現有 spec 標記「即將推出」，不動）
- 不修改登入頁（已有 Google 按鈕，正常運作）

## Decisions

**決策 1：使用 `allowDangerousEmailAccountLinking: true`**
- 在 `auth.ts` Google provider 加上此旗標
- 效果：Google OAuth 登入時若 email 吻合現有帳號，自動合併，不建立第二帳號
- 替代方案：自行實作 cookie + DB 狀態機追蹤「連動意圖」→ 複雜度過高，不符合本專案規模
- 風險：允許任意 Google 帳號以 email 吻合方式接管現有帳號（見 Risks）

**決策 2：「連結帳號」按鈕直接呼叫 `signIn('google', { callbackUrl: '/profile' })`**
- Profile 頁 Client Component 已有 `handleUnlinkGoogle`，同樣模式加 `handleLinkGoogle`
- 不需要額外 server action，`linkGoogleAccount()` stub 可刪除
- OAuth 完成後 NextAuth 自動處理連動，redirect 回 `/profile`

**決策 3：`/register` 頁抽出 `RegisterForm` Client Component，保留 Server Component 外框**
- 與登入頁的 `UserAuthForm` 模式一致
- Google 按鈕在 Client Component 內呼叫 `signIn('google', { callbackUrl: '/dashboard' })`

## Risks / Trade-offs

- [Risk] `allowDangerousEmailAccountLinking` 允許任何擁有相同 email Google 帳號的人合併帳號 → 本專案為內部系統，使用者均為已知成員，風險可接受；若日後開放公開，需搭配 email 驗證流程
- [Risk] 使用者以不同 email Google 帳號嘗試連動，會建立新帳號而非連動 → 在 `/profile` 連動後若偵測到新帳號建立，顯示提示並導回

## Open Questions

- 是否需要偵測「Google email 與系統 email 不符」並給予友善提示？（本次留待後續 CR）
