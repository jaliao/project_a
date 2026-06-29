## Why

對外絕對網址（寄信連結、跨站導向）的建構方式散落且不一致：多處字串拼接 `process.env.NEXTAUTH_URL`、`/api/verify-email` 內有自己的 inline forwarded-host helper、`/api/suspended-logout` 用 `NEXTAUTH_URL ?? req.nextUrl.origin`。其中「route handler 以 `req.url` 建址」在開發 Cloudflare Tunnel 下會取到內部 `localhost:3000` 而導致瀏覽器無法到達（verify-email 已踩過此坑、已修）。為防復發並收斂為單一來源，統一以共用 helper 建構對外網址。

## What Changes

- 新增 `lib/utils/app-url.ts` 共用 helper：
  - `getAppUrl()`：讀 `NEXTAUTH_URL` 回傳對外 base，供 **server action／寄信等無 request 情境**使用（去尾斜線）。
  - `getRequestBaseUrl(req)`：以轉發標頭 `x-forwarded-host`/`x-forwarded-proto`（fallback `host` → `NEXTAUTH_URL`）還原對外 base，供 **route handler 導向**使用（避免 tunnel 取到 localhost）。
- **收斂全部既有出處**改用上述 helper：
  - 寄信/通知連結：`app/actions/profile.ts`（驗證信 ×2）、`app/actions/auth.ts`（密碼重設）、`app/actions/course-invite.ts`（邀請連結）→ `getAppUrl()`。
  - 請求情境導向：`app/api/verify-email/route.ts`（移除 inline helper）、`app/api/suspended-logout/route.ts` → `getRequestBaseUrl(req)`。
- `CLAUDE.md` 新增慣例：對外網址一律用 `lib/auth`／`lib/utils/app-url.ts` 的 helper；**route handler 禁止用 `req.url`/`req.nextUrl.origin` 建對外網址**。

> 行為等價：`NEXTAUTH_URL` 已為公開網域，現有寄信連結與導向本就正確；本變更收斂寫法、強化 route handler 對 tunnel 的韌性、並文件化以防復發。非功能性破壞。

## Capabilities

### New Capabilities

- `app-url-helpers`: 對外絕對網址建構的單一來源——`getAppUrl()`（env-based，寄信/無 request）與 `getRequestBaseUrl(req)`（forwarded-host，route handler 導向）；定義「禁止 route handler 用 req.url 建對外網址」之開發契約。

### Modified Capabilities

（無既有 spec 行為需求變更。）

## Impact

- 新檔：`lib/utils/app-url.ts`。
- 修改：`app/actions/profile.ts`、`app/actions/auth.ts`、`app/actions/course-invite.ts`、`app/api/verify-email/route.ts`、`app/api/suspended-logout/route.ts`。
- 準則：`CLAUDE.md` 新增第 13 條；`config/version.json` patch +1。
- 風險：低（純收斂；`getRequestBaseUrl` 對 route handler 嚴格更穩，`getAppUrl` 等價於既有 `NEXTAUTH_URL` 用法）。寄信為非 request 情境，故維持 env 來源（不可用 forwarded-host）。
