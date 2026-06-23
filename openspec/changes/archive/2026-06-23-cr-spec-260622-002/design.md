## Context

`User.lastLoginAt` 早已存在於 schema，但 `lib/auth.ts` 的登入流程從未寫入，故目前恆為 `null`。本變更要在登入成功時實際記錄登入時間，並額外保留「上一次」登入時間（`previousLoginAt`），同時在會員詳情頁與匯出呈現活躍度資訊。

認證採 NextAuth 5（JWT 策略），同時支援 Google OAuth 與 Credentials 兩種 provider。現有 `signIn` callback 已負責「被暫停會員禁止登入」的守衛，是登入成功與否的唯一交會點。

## Goals / Non-Goals

**Goals:**
- 登入成功（Google 與 Credentials 皆是）時寫入 `lastLoginAt = now()`，並把舊值平移至 `previousLoginAt`。
- 兩個時間點的平移為原子操作，避免讀寫競態。
- 會員詳情頁基本資料分頁顯示「最後登入」「上次登入」「是否完成首次登入」「是否完成首次補填基本資料」「是否已更改臨時密碼」。
- Excel 匯出補齊「上次登入」「已完成首次登入」「已完成首次補填」「已更改臨時密碼」欄位。

**Non-Goals:**
- 不做登入次數累計、登入裝置／IP 紀錄、登入歷史完整 log（只保留最近兩次時間點）。
- 不回填既有會員的歷史登入時間（無資料來源，所有人初始皆視為「未完成首次登入」直到下次登入）。
- 不在會員「列表」頁加標記（僅詳情頁與匯出）。

## Decisions

### 1. 在 `signIn` callback 內更新登入時間
於既有 `signIn({ user })` callback、通過暫停守衛後寫入登入時間。此 callback 對 Google 與 Credentials 皆會觸發，且只在認證成功後執行，語意正確。

- **替代方案**：在 `jwt` callback 內（`user` 存在時）更新。否決原因：`jwt` callback 已承載 Google 首次登入的 spiritId/姓名補核邏輯，混入登入時間會讓該函式職責更雜；且 `signIn` 已是現成的「登入成功」鉤子。

### 2. 以原子 SQL 平移時間點
使用 `prisma.$executeRaw` 單一語句完成欄位對欄位的平移：

```sql
UPDATE "users"
SET "previousLoginAt" = "lastLoginAt", "lastLoginAt" = NOW()
WHERE id = $userId
```

- **替代方案**：先 `findUnique` 讀 `lastLoginAt`、再 `update` 寫入兩欄。否決原因：兩步驟間存在競態（同帳號併發登入），且 Prisma 的 `update` 無法直接做欄位對欄位賦值。原子 SQL 一次到位且無競態。
- 用 `user.id`（Credentials 由 `authorize` 回傳；Google 由 adapter 解析）定位；若 `id` 不存在則退回以 `email` 查 id（沿用既有 callback 的 where 推導邏輯）。

### 3. 「是否完成首次登入」以 `lastLoginAt != null` 推導
不新增布林欄位，直接由 `lastLoginAt` 是否為 `null` 判定，避免冗餘狀態與不一致。詳情頁與匯出皆以此規則呈現（如「已完成 / 尚未登入」）。

### 3a. 「是否完成首次補填基本資料」以 `realName && phone` 推導
沿用既有 `isProfileComplete = !!(realName && phone)` 的判定（與 onboarding Step 2、`profile-completion-guard` 同一規則），不新增欄位或時間戳。詳情頁與匯出以此呈現（如「已補填 / 尚未補填」）。`realName`／`phone` 既有查詢已涵蓋，資料層僅需確保 select 帶出兩欄。

### 3b. 「是否已更改臨時密碼」以 `isTempPassword` 推導，無密碼帳號為「不適用」
`isTempPassword` 的語意是「尚未更改臨時密碼」，僅對以臨時密碼建立的帳號有意義。判定規則：
- `passwordHash == null`（純 Google／無密碼帳號）→ 顯示「不適用」（從未有臨時密碼）。
- `passwordHash != null && isTempPassword == true` → 「尚未更改」。
- `passwordHash != null && isTempPassword == false` → 「已更改」。

此欄與「首次登入」「首次補填」為**獨立的三個指標**，不互相替代（`isTempPassword` 只反映密碼狀態，無法代表是否登入或補填）。資料層 select 需帶出 `isTempPassword` 與 `passwordHash`（後者僅取布林存在性，不外流雜湊值）。

### 4. Schema 變更
`prisma/schema/user.prisma` 的 `User` 新增 `previousLoginAt DateTime?`，緊鄰 `lastLoginAt`。透過 `make schema-update name=add_previous_login_at` 建立 migration（純新增 nullable 欄位，非破壞性）。

## Risks / Trade-offs

- **既有會員初始皆顯示「尚未登入」** → 屬預期：無歷史資料可回填，下次登入後即正確；於手冊／UI 文案說明。
- **`signIn` callback 寫入失敗影響登入** → 以 try/catch 包覆登入時間更新，失敗僅記錄不阻斷登入（活躍度紀錄非登入關鍵路徑）。
- **併發登入競態** → 由原子 SQL 平移消除；最壞情況僅兩次時間點極接近，可接受。
- **Credentials 與 Google 的 `user.id` 可得性差異** → 沿用既有 where 推導（id 優先、email 退回），確保兩條路徑都能定位到正確 user。
