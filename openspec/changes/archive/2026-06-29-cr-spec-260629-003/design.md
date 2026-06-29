## Context

目前「免登入」判定散落：`middleware.ts` 的 `PUBLIC_PATHS` 字串陣列、`lib/utils/guest-paths.ts` 的訪客課程 regex、`app/(user)/layout.tsx` 重做的訪客/轉登入判定。公開頁面實體分散於 `(auth)` 群組、根目錄（`/`、terms、privacy、change-password、account-suspended、onboarding）與 `(user)` 群組特例（課程詳情）。公開 API 僅靠 middleware 白名單列舉，且 `/api/verify-email`、`/api/ecpay/store-map` 未列入。middleware 跑在 Edge runtime，判定模組須為純字串/regex 邏輯（不可引入 prisma 或 Node-only API）。使用者已確認採**完整重構（含 route group 重組）**。

## Goals / Non-Goals

**Goals:**
- 免登入/訪客路由判定收斂為**單一事實來源**，middleware 與 layout 共用。
- 頁面依權限層級以 route group 歸位（`(guest)`／`(user)`／`(admin)`），group layout 即守衛，**URL 不變**。
- 後台 admin 守衛收斂至 `(admin)/layout.tsx`，移除重複檢查。
- 補齊遺漏的公開 API；存取行為對既有路徑維持等價。
- `route-access` 預留 i18n（locale 容忍）；慣例寫入 `CLAUDE.md` 與 `README-AI.md`。

**Non-Goals:**
- 不改變任何路徑的對外 URL。
- 不搬動外部已設定的 API callback URL（ECPay／信件連結）。
- 不導入 i18n 函式庫、不新增 `app/[locale]/` 段（僅預留 `stripLocale`）。
- 不改變登入後業務守衛（暫停、臨時密碼、profile 完整度）的判定邏輯，僅調整其放置（移入對應 group layout）。

## Decisions

- **單一事實來源 `lib/auth/route-access.ts`（Edge-safe，純邏輯）：**
  - `PUBLIC_PAGES: RouteRule[]`、`PUBLIC_APIS: RouteRule[]`、`GUEST_PAGES: RegExp[]`，其中 `RouteRule = { match: 'exact' | 'prefix', path: string, reason: string }`。
  - 導出 `isPublicRoute(pathname): boolean`（比對 PUBLIC_PAGES + PUBLIC_APIS）與 `isGuestRoute(pathname): boolean`（比對 GUEST_PAGES）。
  - 每筆 `reason` 自我說明，取代散落註解。
  - 理由：集中宣告 + 型別化 match 語意（exact/prefix），避免 `startsWith` 誤判（例如 `/login-foo` 不應因 `/login` 前綴而放行——改用明確 exact/prefix）。
- **middleware 與 layout 改用共用判定：** `middleware.ts` 用 `isPublicRoute`/`isGuestRoute`；`app/(user)/layout.tsx` 用 `isGuestRoute`。移除各自的 `PUBLIC_PATHS`／重複 guest 判定。`lib/utils/guest-paths.ts` 內容併入 `route-access.ts` 後移除，並更新引用。
- **依權限層級分組（route group，URL 中性），group `layout.tsx` 即守衛：**
  - `app/(guest)/`（新增，含薄 layout）：免登入頁——`/`（`page.tsx`）、login／register／forgot／reset／recover-account、`terms`、`privacy`，以及「已登入但特殊」的 `account-suspended`／`onboarding`／`change-password`（其頁面自行 `auth()` 處理）。layout **不可**盲目把已登入者導走（terms/privacy 登入後須可看）。既有 `(auth)/` 之頁面歸入 `(guest)`（不再保留 `(auth)`，避免又一層分類）。
  - `app/(user)/`（既有）：需登入頁；layout 維持 Topbar + 暫停／臨時密碼／profile 守衛。
  - `app/(admin)/`（新增）：需 admin 身分。`app/(admin)/layout.tsx` 依序做 session → 暫停 → `canAccessAdmin` 守衛並渲染 Topbar；整批移動 `app/(user)/admin/*` → `app/(admin)/admin/*`（literal `admin` 段維持 URL `/admin/*`），並**移除各後台頁重複的 `if (!canAccessAdmin) redirect('/')`**（約 6 處）。
  - 課程詳情訪客頁維持以 `GUEST_PAGES` regex 驅動（仍在 `(user)`，共用其精簡訪客分支）。
  - 理由：route group `()` 不影響 URL；以資料夾＝權限層級，並讓 layout 成為單一守衛點（DRY）。
- **兩層防護：** middleware（Edge，便宜）用 `route-access` 決定是否導 `/login`；group `layout.tsx`（Node，權威）做實際 session/role 守衛。registry 是「免 login 預檢」來源，layout 是強制點。
- **i18n 容忍：** `route-access.ts` 導出 `stripLocale(pathname)`，`isPublicRoute`/`isGuestRoute` 比對前先剝除可能的 `/<locale>` 前綴（白名單 locale，如 `zh`／`en`），為日後 `app/[locale]/` 鋪路；本期不導入 i18n 函式庫、不加 `[locale]` 段。
- **補齊公開 API：** `/api/verify-email` 納入 `PUBLIC_APIS`（信件連結點擊時可能未登入）。`/api/ecpay/store-map` 於實作時覆核：若供前端已登入情境使用則維持受保護，否則納入。
- **慣例落準則：** `CLAUDE.md` 新增「新增免登入頁面/API → 必在 `lib/auth/route-access.ts` 註冊（附 reason），公開頁放入 `(public)`／`(auth)` 群組」；`README-AI.md` 架構章節同步。

## Risks / Trade-offs

- [admin 整批搬移牽動大量 import 與守衛覆蓋] → `app/(user)/admin/*` 移至 `app/(admin)/admin/*` 後，`(admin)/layout.tsx` 須補上原由 `(user)/layout` 提供的 session/暫停/Topbar；逐頁移除重複 admin 檢查；以 `npm run build` 全量型別檢查 + 手測 `/admin`、`/admin/members` 等。
- [搬移檔案可能誤改 URL 或漏帶相依檔（form 元件、layout）] → route group 不改 URL；搬移時連同同資料夾元件一起移動，移動後 build + 逐一手測關鍵 URL（`/`、`/terms`、`/onboarding`、`/account-suspended`、`/admin/*`）。
- [exact/prefix 語意調整可能改變放行範圍] → 對照舊 `PUBLIC_PATHS` 逐筆轉換並標註 match 類型，確保等價（含子路徑放行的既有行為）。
- [公開 API 覆核不全] → 逐一檢視 `app/api/**/route.ts`，明確分類 public/protected，遺漏者補入 registry。
- [Edge runtime 限制] → `route-access.ts` 僅純字串/regex，無任何 Node/DB 相依。

## Migration Plan

- 無資料庫變更。步驟：建 `route-access.ts`（含 `stripLocale`）→ 改 middleware/layout 引用 → 移除 `guest-paths.ts` → 建 `(guest)`/`(admin)` layout → 搬移頁面進 group（含 admin 整批）→ 移除重複 admin 檢查 → 補公開 API → 更新 `CLAUDE.md`/`README-AI.md` → `build`/`lint` + 手測關鍵 URL。回退：還原檔案位置與 middleware 既有白名單。建議以 `git mv` 搬移以保留歷史，並分段 commit（registry／(guest)／(admin)）。

## Open Questions

- `/api/ecpay/store-map` 是否須公開（依其呼叫情境於實作時決定）。
