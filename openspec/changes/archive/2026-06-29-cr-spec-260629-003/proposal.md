## Why

「免登入（公開）」的判定與檔案目前散落多處：`middleware.ts` 以手維護的 `PUBLIC_PATHS` 字串陣列判斷、`lib/utils/guest-paths.ts` 另存訪客課程 regex、`app/(user)/layout.tsx` 又各自重做一次訪客/轉登入判定；公開頁面實體分散於 `(auth)` 群組、根目錄與 `(user)` 群組特例；公開 API 僅靠 middleware 內白名單列舉（且 `/api/verify-email`、`/api/ecpay/store-map` 未列入）。新增免登入頁面時極易漏改白名單（`/recover-account` 即曾因此被導去登入）。需要一套**單一事實來源 + 命名/放置慣例**來統一管理，並寫入開發準則供日後遵循。

## What Changes

- 建立**單一事實來源** `lib/auth/route-access.ts`：集中宣告
  - `PUBLIC_PAGES`（免登入頁面，exact／prefix）
  - `PUBLIC_APIS`（免登入 API，prefix）
  - `GUEST_PAGES`（需登入體驗但未登入也可進、由頁面顯示登入提示，如課程詳情 regex）
  - 並導出 `isPublicRoute(pathname)`、`isGuestRoute(pathname)` 輔助函式；每筆宣告附**簡短原因註解**自我說明。
- `middleware.ts` 與 `app/(user)/layout.tsx` 一律改用上述輔助函式，**移除重複判定**；`lib/utils/guest-paths.ts` 內容併入新模組（保留薄 re-export 或移除引用）。
- **補齊遺漏的公開 API**：將 `/api/verify-email`（信件驗證連結，點擊時可能未登入）等確認為公開者納入 `PUBLIC_APIS`。
- **依權限層級分組（route group，URL 不變），且每個 group 的 `layout.tsx` 即該層守衛**：
  - `app/(guest)/`：免登入頁（首頁 `/`、login／register／forgot／reset／recover-account、terms／privacy、以及已登入但特殊的 account-suspended／onboarding／change-password——其自行 `auth()` 處理）；layout 為極簡無殼，**不可**盲目把已登入者導走（terms/privacy 登入後也須可看）。
  - `app/(user)/`：需登入頁；layout 維持 Topbar + 暫停／臨時密碼／profile 完整度守衛。
  - `app/(admin)/`：需 admin 身分；新增 `layout.tsx` 做一次 `canAccessAdmin` 守衛，**移除散在各後台頁重複的 `if (!canAccessAdmin) redirect('/')`**。將 `app/(user)/admin/*` 整批移至 `app/(admin)/admin/*`（URL `/admin/*` 不變）。
  - 公開 API：以 registry 宣告為準（外部已設定的 callback URL 不搬動）。
- **兩層防護**：middleware（Edge，便宜）以 `route-access` 判定是否導向 `/login`；group `layout.tsx`（Node，權威）做實際 session/role 守衛。
- **預留 i18n**：`route-access.ts` 設計為 locale 容忍——比對前先 `stripLocale()` 剝除可能的 `/<locale>` 前綴（為日後 `app/[locale]/` 路徑前綴鋪路；本期不導入 i18n 函式庫）。
- **寫入開發準則**：於 `CLAUDE.md` 新增「免登入路由必在 `lib/auth/route-access.ts` 註冊（附 reason）；頁面依權限放入 `(guest)`／`(user)`／`(admin)` group，該 group layout 負責守衛」之規範；`README-AI.md` 架構章節同步說明。

> 行為保持等價（純重構）：原本可公開存取的路徑維持公開、受保護路徑維持受保護；僅修補既有遺漏（如 verify-email）。

## Capabilities

### New Capabilities

- `public-route-registry`: 免登入路由的單一事實來源與註冊慣例——集中宣告公開頁面/API/訪客頁、提供 `isPublicRoute`/`isGuestRoute`（locale 容忍），由 middleware 與 layout 共用；並定義「依權限層級 `(guest)`／`(user)`／`(admin)` route group 分組、group layout 即守衛」的開發契約。

### Modified Capabilities

（無既有 spec 的行為需求變更；本變更為架構重構，存取行為維持等價。）

## Impact

- 新檔：`lib/auth/route-access.ts`（單一事實來源 + `isPublicRoute`/`isGuestRoute` + `stripLocale`）；`app/(guest)/layout.tsx`、`app/(admin)/layout.tsx`。
- 修改：`middleware.ts`、`app/(user)/layout.tsx` 改用共用判定；`lib/utils/guest-paths.ts` 併入後移除。
- 搬移（route group，URL 不變）：
  - → `app/(guest)/`：`app/page.tsx`、`terms`、`privacy`、`account-suspended`、`change-password`、`onboarding`（既有 `(auth)/` 之 login/register/forgot/reset/recover 一併歸入 `(guest)` 或保留 `(auth)` 子群，由 design 定）。
  - → `app/(admin)/admin/*`：整批移動 `app/(user)/admin/*`，並由 `app/(admin)/layout.tsx` 統一守衛；移除各後台頁重複的 admin 檢查。
- 開發準則：`CLAUDE.md` 新增路由分組與註冊規範；`README-AI.md` 架構章節更新（route group 結構、route-access、layout 守衛）。
- 風險：admin 整批搬移牽動大量 import 與 `(user)` layout 守衛覆蓋（暫停/臨時密碼檢查需於 `(admin)` layout 補上）；URL 必須不變；公開 API 清單需逐一覆核。
