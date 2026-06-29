## 1. 共用 helper

- [x] 1.1 新增 `lib/utils/app-url.ts`：`getAppUrl()`（讀 NEXTAUTH_URL、去尾斜線）、`getRequestBaseUrl(req)`（x-forwarded-host → host → NEXTAUTH_URL → origin；proto 取 x-forwarded-proto fallback https）

## 2. 收斂寄信/通知連結（getAppUrl）

- [x] 2.1 `app/actions/profile.ts`：兩處 verify-email 連結改用 `getAppUrl()`
- [x] 2.2 `app/actions/auth.ts`：密碼重設連結改用 `getAppUrl()`
- [x] 2.3 `app/actions/course-invite.ts`：邀請連結改用 `getAppUrl()`

## 3. 收斂請求情境導向（getRequestBaseUrl）

- [x] 3.1 `app/api/verify-email/route.ts`：移除 inline `getPublicBaseUrl`，改用 `getRequestBaseUrl(req)`
- [x] 3.2 `app/api/suspended-logout/route.ts`：`base` 改用 `getRequestBaseUrl(req)`

## 4. 準則與版本

- [x] 4.1 `CLAUDE.md` 新增第 13 條（對外網址用 helper；route handler 禁用 `req.url`/`origin`）
- [x] 4.2 `config/version.json` 0.1.101 → 0.1.102（README-AI 同步）

## 5. 驗證

- [x] 5.1 `npm run build`（✓ Compiled）與 `npm run lint`（0 errors）通過
- [x] 5.2 grep 確認 route handler 不再以 `req.url`/`req.nextUrl.origin` 建對外導向
- [ ] 5.3 （執行階段，使用者）verify-email 於 dev tunnel 導向對外網域、不落 localhost
