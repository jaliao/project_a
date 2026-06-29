## 1. 單一事實來源

- [x] 1.1 建 `lib/auth/route-access.ts`（Edge-safe）：`RouteRule` 型別、`PUBLIC_PAGES`、`PUBLIC_APIS`、`GUEST_PAGES`（含 reason）
- [x] 1.2 導出 `isPublicRoute(pathname)`、`isGuestRoute(pathname)`；exact/prefix 比對語意明確
- [x] 1.3 導出 `stripLocale(pathname)`（白名單 locale），`isPublicRoute`/`isGuestRoute` 比對前先剝除 locale 前綴
- [x] 1.4 將舊 `PUBLIC_PATHS` 逐筆轉為對應 exact/prefix 宣告（含 `/`、`/api/auth`、ecpay callback、suspended-logout 等），確保等價

## 2. 收斂判定

- [x] 2.1 `middleware.ts` 改用 `isPublicRoute`/`isGuestRoute`，移除本地 `PUBLIC_PATHS`
- [x] 2.2 `app/(user)/layout.tsx` 改用 `isGuestRoute`，移除對 `guest-paths` 的引用
- [x] 2.3 移除 `lib/utils/guest-paths.ts`（內容已併入 route-access），更新所有引用

## 3. 補齊公開 API

- [x] 3.1 逐一檢視 `app/api/**/route.ts`，分類 public/protected
- [x] 3.2 `/api/verify-email` 納入 `PUBLIC_APIS`；`/api/ecpay/store-map` 維持受保護（由已登入瀏覽器於結帳時呼叫，內無 auth；保留現狀）

## 4. (guest) group

- [x] 4.1 建 `app/(guest)/layout.tsx`（薄 passthrough；不阻擋已登入者）
- [x] 4.2 `git mv` 移入 `(guest)`：`page.tsx`（`/`）、`terms`、`privacy`、`account-suspended`、`change-password`、`onboarding`
- [x] 4.3 既有 `app/(auth)/*`（login/register/forgot/reset/recover-account）併入 `(guest)`，移除 `(auth)` group
- [x] 4.4 確認移動後 URL 不變（build route 表逐一比對）、relative import 隨資料夾移動正確

## 5. (admin) group 抽離

- [x] 5.1 建 `app/(admin)/layout.tsx`：登入 → 暫停 → 臨時密碼 → profile 完整度 → `canAccessAdmin` 守衛 + Topbar
- [x] 5.2 `git mv` 整批移動 `app/(user)/admin/*` → `app/(admin)/admin/*`（URL `/admin/*` 不變）
- [x] 5.3 移除 8 後台頁重複的 session/`canAccessAdmin` 轉導判定（並順手關閉 `/admin` 首頁原本缺 admin 守衛的漏洞）
- [x] 5.4 修正搬移後 import；build route 表確認 `/admin`、`/admin/members`、`/admin/members/inactive` 等 URL 不變

## 6. 開發準則

- [x] 6.1 `CLAUDE.md` 新增第 11 條（route-access 單一事實來源 + `(guest)`/`(user)`/`(admin)` 分組與 layout 守衛規範）
- [x] 6.2 `README-AI.md` 架構章節更新（route group 結構、route-access、layout 守衛、stripLocale 預留 i18n）

## 7. 驗證

- [x] 7.1 `npm run build`（✓ Compiled）與 `npm run lint`（0 errors）通過
- [x] 7.2 URL 不變（build route 表確認）：`/`、`/login`、`/terms`、`/privacy`、`/onboarding`、`/account-suspended`、`/recover-account`、`/course/[id]` 皆在
- [x] 7.3 受保護路由邏輯：未命中 `isPublicRoute`/`isGuestRoute` → middleware 導 `/login`；`(admin)/layout` 對非 admin `redirect('/')`
- [x] 7.4 `/api/verify-email` 已納入 `PUBLIC_APIS`（未登入可達）

## 8. 版本

- [x] 8.1 `config/version.json` 0.1.99 → 0.1.100（純架構/準則變更，手冊無使用者面異動故不動）
