# public-route-registry Specification

## Purpose
TBD - created by archiving change cr-spec-260629-003. Update Purpose after archive.
## Requirements
### Requirement: 免登入路由單一事實來源
系統 SHALL 以單一模組 `lib/auth/route-access.ts` 集中宣告所有免登入路由，分為 `PUBLIC_PAGES`（免登入頁面）、`PUBLIC_APIS`（免登入 API）、`GUEST_PAGES`（未登入可進、由頁面顯示登入提示），並導出 `isPublicRoute(pathname)` 與 `isGuestRoute(pathname)` 輔助函式。此模組 SHALL 為純字串/正規表達式邏輯，可於 Edge runtime 執行（不得相依資料庫或 Node-only API）。每筆宣告 SHALL 附帶簡短原因（reason）。

#### Scenario: 宣告為公開的頁面免登入可達
- **WHEN** 某路徑於 `PUBLIC_PAGES` 宣告為公開
- **THEN** `isPublicRoute(該路徑)` 回傳 true

#### Scenario: 宣告為公開的 API 免登入可達
- **WHEN** 某 API 路徑於 `PUBLIC_APIS` 宣告為公開
- **THEN** `isPublicRoute(該 API 路徑)` 回傳 true

#### Scenario: 未宣告的路徑視為受保護
- **WHEN** 某路徑未出現在任何宣告
- **THEN** `isPublicRoute` 與 `isGuestRoute` 皆回傳 false

#### Scenario: exact 與 prefix 比對語意明確
- **WHEN** 宣告以 `exact` 比對 `/login`
- **THEN** `/login` 命中、`/login-foo` 不命中（不因前綴誤放行）

#### Scenario: locale 前綴容忍
- **WHEN** 比對帶 locale 前綴的路徑（如 `/en/login`）
- **THEN** 先以 `stripLocale` 剝除 locale 段後再比對，`/en/login` 與 `/login` 判定一致

### Requirement: middleware 與 layout 共用同一判定
`middleware.ts` 與 `app/(user)/layout.tsx` SHALL 一律透過 `lib/auth/route-access.ts` 的輔助函式判定免登入/訪客放行，不得各自維護重複的路由清單或判定邏輯。

#### Scenario: middleware 放行公開路由
- **WHEN** 未登入請求命中 `isPublicRoute`
- **THEN** middleware 放行，不導向 `/login`

#### Scenario: 訪客頁兩處判定一致
- **WHEN** 未登入請求命中 `isGuestRoute`（如課程詳情）
- **THEN** middleware 放行，且 `(user)/layout.tsx` 渲染訪客精簡版面（不導向 `/login`），兩處依據同一函式

#### Scenario: 受保護路由未登入導向登入
- **WHEN** 未登入請求未命中公開/訪客判定
- **THEN** middleware 導向 `/login` 並帶 `callbackUrl`

### Requirement: 頁面依權限層級以 route group 歸位
頁面 SHALL 依權限層級置於對應 route group，且各 group 的 `layout.tsx` 為該層守衛：免登入頁於 `app/(guest)/`、需登入頁於 `app/(user)/`、需 admin 身分頁於 `app/(admin)/`。route group 不得改變對外 URL。

#### Scenario: route group 不改變 URL
- **WHEN** 將頁面移入 `(guest)`／`(user)`／`(admin)` 群組
- **THEN** 其對外 URL 與移動前相同（如 `/admin/members` 維持不變）

#### Scenario: guest layout 不阻擋已登入者
- **WHEN** 已登入使用者開啟 `(guest)` 內的 terms／privacy
- **THEN** 正常顯示，不被導走

#### Scenario: 公開 API 完整登錄
- **WHEN** 某 API 需免登入存取（如信件驗證連結 `/api/verify-email`）
- **THEN** 該 API 出現在 `PUBLIC_APIS`，未登入存取不被導向 `/login`

### Requirement: 後台守衛收斂於 (admin) layout
`app/(admin)/layout.tsx` SHALL 統一執行後台守衛（要求登入並具 `admin`／`superadmin` 身分），後台各頁 SHALL NOT 各自重複 `canAccessAdmin` 轉導判定。

#### Scenario: 非管理者存取後台被擋
- **WHEN** 非管理者存取 `(admin)` 群組下任一頁
- **THEN** 由 `(admin)/layout.tsx` 統一導離（無權限）

#### Scenario: 後台頁不再重複守衛
- **WHEN** 檢視 `(admin)` 群組下各頁
- **THEN** 各頁不再各自寫 `if (!canAccessAdmin) redirect(...)`，守衛僅在 layout 一處

### Requirement: 新增免登入路由的開發準則
專案開發準則（`CLAUDE.md`）SHALL 載明：新增任何免登入頁面或 API 時，必須於 `lib/auth/route-access.ts` 註冊（附 reason），且公開頁面須置於 `(public)` 或 `(auth)` route group。

#### Scenario: 準則文件載明註冊規範
- **WHEN** 開發者查閱 `CLAUDE.md`
- **THEN** 可找到「新增免登入路由須在 `route-access.ts` 註冊並放入對應 route group」之規範

