## Context

`.env` 的 `NEXTAUTH_URL=https://project-a-dev.blockcode.com.tw`（公開網域）。對外網址建構散落：`profile.ts`/`auth.ts`/`course-invite.ts` 字串拼接 `NEXTAUTH_URL`；`verify-email` 有 inline forwarded-host helper（前一變更為修 tunnel→localhost 而加）；`suspended-logout` 用 `NEXTAUTH_URL ?? req.nextUrl.origin`。根因坑：route handler（Node runtime）`req.url` 的 host 經 cloudflared 會是內部 `localhost:3000`。

## Goals / Non-Goals

**Goals:**
- 單一來源建構對外網址；route handler 導向對 tunnel 有韌性；文件化防復發。

**Non-Goals:**
- 不改變對外網址的實際值（行為等價）。
- 不改 middleware（其 `req.nextUrl` 於 Edge 已正確解析對外 host，登入導向實測正常）。
- 不改 ECPay client 端 `window.location.origin`（瀏覽器端本就是對外 origin）。

## Decisions

- **兩個函式、兩種來源（依情境）：**
  - `getAppUrl(): string` —— 讀 `process.env.NEXTAUTH_URL`，去尾斜線回傳；給**無 request**情境（server action 寄信/通知連結）。無 request 時無法取 forwarded-host，env 是唯一可靠來源。
  - `getRequestBaseUrl(req: NextRequest): string` —— `x-forwarded-host` → `host` → `NEXTAUTH_URL` → `req.nextUrl.origin` 依序取；proto 取 `x-forwarded-proto`（fallback https）。給 **route handler 導向**；對 tunnel 嚴格更穩（env 設錯也不壞）。
- **為何寄信不用 forwarded-host：** 寄信在 server action 內，雖可 `headers()` 取，但通知/信件未必都有可信 request 情境（未來背景寄送），故統一以 `getAppUrl()`（env）為準，語意清楚。
- **verify-email：** 移除其 inline `getPublicBaseUrl`，改用共用 `getRequestBaseUrl`，行為一致。
- **慣例落準則：** `CLAUDE.md` 第 13 條明訂 helper 用法與「route handler 禁用 `req.url`/`origin` 建對外網址」。

## Risks / Trade-offs

- [getAppUrl 依賴 NEXTAUTH_URL 正確設定] → 與現狀相同（現有寄信本就靠它）；`.env` 已為公開網域。
- [getRequestBaseUrl 信任轉發標頭] → 僅用於導向自身站點路徑（非開放重導），且 fallback NEXTAUTH_URL；風險低。

## Migration Plan

- 新增 `lib/utils/app-url.ts` → 重構 5 處 → `CLAUDE.md` + version → `build`/`lint`。回退：還原各處 inline/字串寫法。

## Open Questions

- 無。
