## Context

被暫停封鎖目前落在登入表單頁本身（`/login?error=Suspended`）。實測（HTTP 重現，含沿用同一份 cookie 跨「暫停→恢復」）證實伺服器、CSRF、cookie 路徑皆正常；失敗只發生在瀏覽器那個「被導向後一直沒重載、且在暫停中提交過」的登入分頁——NextAuth client 端狀態壞掉，恢復後同頁再登入回報「密碼不正確」，整頁重載 `/login` 即正常。結論：封鎖訊息不該與登入表單共用同一頁。

## Goals / Non-Goals

**Goals**
- 被暫停的封鎖訊息移到**獨立頁** `/account-suspended`，登入表單頁恆保持乾淨。
- 提供「重新登入」**整頁連結**至 `/login`，恢復後可直接登入、免手動重載。
- 既有 session 被暫停、與被暫停帳號的登入嘗試，皆一致導向此頁。

**Non-Goals**
- 不更動後端暫停判定、資料模型、`suspendMember`/`unsuspendMember`（屬 cr-spec-260621-005）。
- 不改 Google/Credentials 的認證邏輯本身，只改「被擋之後導向何處」。

## Decisions

### 1. 獨立頁 `/account-suspended`（Server Component，公開）
- 路徑 `app/account-suspended/page.tsx`，純靜態：標題「此帳號已被暫停」、說明「無法登入，請聯繫管理員」、**「重新登入」按鈕為一般 `<Link href="/login">`/`<a>`（整頁導覽）**。
- 不讀取 session、不做任何 client 端 auth 呼叫，確保此頁本身不累積壞狀態。
- `middleware.ts` 的 `PUBLIC_PATHS` 加入 `/account-suspended`。

### 2. 封鎖導向統一改為 `/account-suspended`
- `app/api/suspended-logout/route.ts`：清除 session cookie 後，`NextResponse.redirect` 目標由 `/login?error=Suspended` 改為 `/account-suspended`（仍用 `NEXTAUTH_URL` 組公開網址，避免 cloudflared 內部 host）。
- `lib/auth.ts` signIn 守衛：被暫停帳號的登入嘗試 `return '/account-suspended'`（取代 `'/login?error=Suspended'`）。

### 3. 登入頁回歸單純
- `app/(auth)/login/user-auth-form.tsx`：移除 `const suspended = searchParams.get('error') === 'Suspended'`、暫停橫幅 JSX。登入表單不再承載任何暫停狀態。

### 4. 「重新登入」為何用整頁載入
- 一般連結（`<a>`/`<Link>` 預設）造成完整導覽，重新拉取乾淨的登入頁與 CSRF 脈絡，徹底避開上一個分頁殘留的 NextAuth client 狀態——這正是手動改網址可登入的原因，把它變成按鈕化。

## Flows

- **既有 session 被暫停**：受保護頁 → `(user)/layout` 偵測 `suspendedAt` → `redirect('/api/suspended-logout')` → 清 cookie → `/account-suspended`。
- **被暫停帳號嘗試登入**：`/login` 送出 → signIn 守衛偵測暫停 → 導向 `/account-suspended`（不建立 session）。
- **恢復後登入**：`/account-suspended` →「重新登入」→ 整頁載入 `/login` → 送出 → 守衛通過 → 正常登入。

## Risks / Trade-offs

- 既有指向 `/login?error=Suspended` 的連結/書籤會失效——影響極小（僅暫停流程內部使用），全數改為 `/account-suspended`。
- `/account-suspended` 為公開頁，任何人可直接瀏覽——僅靜態提示文字，無資料外洩風險。
