## Context

目前已登入會員若未填寫 `realName`、`phone`，Profile 頁面僅顯示靜態橘色警告框，強制力不足。Middleware 執行於 Edge Runtime，無法直接查詢資料庫，因此無法在 middleware 層做 profile 完整性檢查。`app/(user)/layout.tsx` 是 Server Component，已呼叫 `auth()`，是加入資料庫查詢的自然位置。

## Goals / Non-Goals

**Goals:**
- 新增 `REQUIRE_PROFILE_COMPLETION` 環境變數（預設 `true`）
- 當變數為 `true` 時，在 `(user)` layout 查詢 `realName`/`phone`，若缺失則導向 `/user/[spiritId]/profile?incomplete=1`
- 當變數為 `false` 時，維持現有 Profile 頁橘色警告框行為（不做任何轉導）
- Profile 頁本身排除在轉導邏輯之外（避免無限迴圈）

**Non-Goals:**
- 不在 middleware 層做 profile 檢查（Edge Runtime 無法查 DB）
- 不更改 dashboard banner（`profile-completion-banner`）的現有邏輯
- 不強制要求 `commEmail`（僅 `realName` + `phone` 為必填最低門檻）

## Decisions

### D1：在 `(user)/layout.tsx` 做轉導，而非 middleware
**決定**：layout server component 負責 profile guard。

**理由**：middleware 執行於 Edge Runtime，無 Prisma 存取權。layout 已有 session，加一次 DB 查詢即可取得 `realName`、`phone`、`spiritId`。

**替代方案考慮**：
- 將 `isProfileComplete` 寫入 JWT session（每次登入設定）→ 資料更新後 session 不即時反映，需等到重新登入，體驗差。
- 用 middleware + cookie（layout 寫 cookie，middleware 讀）→ 多一層間接，且 cookie 可被用戶清除繞過。

### D2：排除路徑白名單
**決定**：`pathname.startsWith('/user/') && pathname.includes('/profile')` 的路由排除轉導。

**理由**：防止無限導向迴圈。API 路由、`/change-password` 等已在 middleware 白名單，layout 只需排除 profile 路徑。

### D3：環境變數讀取位置
**決定**：在 `(user)/layout.tsx` 直接讀取 `process.env.REQUIRE_PROFILE_COMPLETION`。

**理由**：Server Component 可直接存取 `process.env`，不需額外 config 檔。預設值為 `'true'`（空字串或未設定視為 `true`）。

### D4：`?incomplete=1` query param
**決定**：轉導時帶入 `?incomplete=1`，profile 頁讀取後顯示專屬提示「請先填寫必要資料，才能繼續使用系統」，優先於既有橘色框。

## Risks / Trade-offs

- **每次頁面請求多一次 DB 查詢**：layout 已有 session 查詢，再加 `select: { realName, phone, spiritId }` 查詢輕量，影響可接受。可用 `Promise.all` 與既有查詢並行。
- **用戶可直接輸入 URL 存取非 profile 頁**：layout 在每次請求都執行，無法繞過。
- **`spiritId` 為 null 的邊界情況**：若 `spiritId` 尚未核發，導向 `/user//profile` 會 404。處理：fallback 導向 `/user/profile`（或直接顯示警告不轉導）。
