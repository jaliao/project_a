## Context

當前 Dashboard 首頁（`app/(user)/dashboard/page.tsx`）已為 Server Component 並使用 `force-dynamic`，可直接查詢登入使用者的個人資料。Profile 頁面（`app/(user)/profile/`）包含 `ProfileForm`（Client Component）負責基本資料、通訊 Email、帳號連動三個區塊，但缺少登出按鈕。`User` 模型目前無 `nickname` 欄位；`updateProfileSchema` 未包含 nickname。

## Goals / Non-Goals

**Goals:**
- Dashboard 首頁依登入使用者的 realName、commEmail、phone 是否填寫，顯示提醒 Banner 或歡迎訊息
- `User` 資料庫模型新增 `nickname String?`
- Profile 基本資料表單新增暱稱欄位，並儲存至資料庫
- Profile 頁面新增「登出」按鈕，呼叫 NextAuth `signOut()`

**Non-Goals:**
- 不做 email 驗證狀態納入完整度判斷（commEmail 填寫即算完整）
- 不做 nickname 顯示於 Topbar 或其他頁面
- 不強制要求 nickname 填寫

## Decisions

### 1. 資料完整度判斷位置：Server Component（Dashboard page）

在 `DashboardPage`（Server Component）直接查詢當前使用者的 realName、commEmail、phone，判斷完整度後以 props 傳入新的 `ProfileBanner` Client Component。

**理由**：Dashboard page 已是 Server Component，可直接呼叫 `auth()` 取得 session userId 再查 DB，無需額外 API Route 或 Client fetch。避免在 Client 層暴露資料完整度邏輯。

### 2. ProfileBanner 為純 Client Component，接收 `isComplete: boolean` 與 `name: string | null`

Server Component 傳入兩個 props：
- `isComplete`：決定顯示 Banner 或歡迎訊息
- `displayName`：realName（優先）或 name（fallback）

**理由**：元件本身不需要互動，純顯示即可。未來若需加「不再提示」功能可升級為有 state 的元件。Banner 點擊連結導向 `/profile`。

### 3. nickname 欄位：`User` 模型新增 `nickname String?`

加入現有 `user.prisma` 的 `User` model，需一次 migration（`add_nickname`）。`updateProfileSchema` 新增 `nickname: z.string().max(20).optional()`，`updateProfile` Server Action 新增 `nickname` 欄位處理。

### 4. 登出按鈕：Profile 頁面新增獨立 section

在 `profile/page.tsx`（Server Component）底部新增一個 `<SignOutSection>`（Client Component），內含 shadcn `Button` variant `outline` 呼叫 `signOut({ callbackUrl: '/login' })`。

**理由**：`signOut` 來自 `next-auth/react`，只能在 Client Component 呼叫，因此需獨立成 Client Component 嵌入 Server Component 頁面。

## Risks / Trade-offs

- **Prisma migration 需手動執行**：`make schema-update name=add_nickname`，開發與生產環境都需執行。
  → 與既有 CR 流程一致，tasks.md 會明確列出此步驟。
- **nickname 顯示名稱的優先順序**：歡迎訊息使用 `realName ?? name ?? '會員'`，若三者皆空則顯示「歡迎回來！」。
  → 簡單 fallback 策略，可接受。

## Open Questions

（無）
