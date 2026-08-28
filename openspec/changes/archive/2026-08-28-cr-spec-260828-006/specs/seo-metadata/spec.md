## ADDED Requirements

### Requirement: 站台對外網址單一來源

系統 SHALL 提供 `getSiteUrl()`（`lib/utils/site-url.ts`），依序取 `NEXT_PUBLIC_SITE_URL` → `NEXTAUTH_URL` → `http://localhost:3000`，並去除結尾斜線。所有 SEO 用途的絕對網址（`metadataBase`、`robots.ts`、`sitemap.ts`、JSON-LD）SHALL 透過此函式取得，SHALL NOT 於程式碼寫死網域字串。`.env.example` SHALL 記載 `NEXT_PUBLIC_SITE_URL`（正式對外 HTTPS 網域）與其用途。

#### Scenario: 設定了正式網域
- **WHEN** `NEXT_PUBLIC_SITE_URL` 設為 `https://example.org/`
- **THEN** `getSiteUrl()` 回傳 `https://example.org`（去尾斜線）

#### Scenario: 未設定站台網域時回退
- **WHEN** `NEXT_PUBLIC_SITE_URL` 未設定但 `NEXTAUTH_URL` 為 `https://app.example.org`
- **THEN** `getSiteUrl()` 回傳 `https://app.example.org`

#### Scenario: 皆未設定時的開發預設
- **WHEN** 兩個環境變數皆未設定
- **THEN** `getSiteUrl()` 回傳 `http://localhost:3000`

### Requirement: 根 metadata SEO 欄位

`app/[locale]/layout.tsx` 的 `generateMetadata` SHALL 提供：`metadataBase`（= `new URL(getSiteUrl())`）、`title.default`（含站名與「啟動靈人・啟動豐盛・啟動得勝」關鍵字）、`title.template`（`%s — 啟動事工`）、`description`（涵蓋三個旗艦課程與事工定位，取自 i18n）、`keywords`（含 `啟動事工`／`啟動靈人`／`啟動豐盛`／`啟動得勝`）、`openGraph`（`type: website`、`siteName`、`locale`、`url`、`title`、`description`、`images`）、`twitter`（`card: summary`、`title`、`description`）、`alternates.canonical`（`/`）、`alternates.languages`（`zh-TW`／`en`／`zh-CN` 對應網址）、`robots`（`index: true, follow: true`）。既有內頁以字串形式設定的 `title` SHALL NOT 被本變更更動。

#### Scenario: 首頁輸出完整 metadata
- **WHEN** 爬蟲抓取 `/`
- **THEN** 回應 HTML `<head>` 含絕對網址的 canonical、OpenGraph（og:title／og:description／og:image／og:url／og:type）、description、keywords，且 `<title>` 為含關鍵字的預設標題

#### Scenario: hreflang 標註
- **WHEN** 檢視任一頁的 `<head>`
- **THEN** 含 `rel="alternate" hreflang="zh-TW|en|zh-CN"` 指向對應語言網址

#### Scenario: 內頁沿用站名後綴
- **WHEN** 某頁僅提供短 `title`（未含站名）
- **THEN** 最終 `<title>` 依 template 呈現為「<短 title> — 啟動事工」

#### Scenario: 既有內頁 title 不變
- **WHEN** 某後台頁已設 `metadata.title = 'XXX — 啟動事工'`（字串）
- **THEN** 該頁 `<title>` 維持 `XXX — 啟動事工`，不因 template 疊加而重複站名

### Requirement: robots 產生

系統 SHALL 以 `app/robots.ts` 產生 `/robots.txt`：允許一般爬蟲抓取，`disallow` 非公開區塊（至少含 `/api/`、`/admin/`、`/user/`、`/dashboard`、`/onboarding`、`/reset-password`、`/change-password`、`/account-suspended`、`/invites`、`/messages`、`/notifications`、`/recover-account`、`/forgot-password`），並宣告 `sitemap`（`${getSiteUrl()}/sitemap.xml`）與 `host`（`getSiteUrl()`）。`middleware.ts` 的 `matcher` SHALL 排除 `/robots.txt`，使其不被套上 locale 前綴。

#### Scenario: 取得 robots.txt
- **WHEN** 請求 `/robots.txt`
- **THEN** 回傳 `text/plain`，含 `Allow: /`、上述 `Disallow` 路徑、`Sitemap:` 絕對網址一行

#### Scenario: 後台路徑被禁止索引
- **WHEN** 檢視 `/robots.txt`
- **THEN** `/admin/` 與 `/user/` 出現在 `Disallow` 清單中

### Requirement: sitemap 產生

系統 SHALL 以 `app/sitemap.ts` 產生 `/sitemap.xml`，列出公開可索引頁：`/`、`/courses`、`/terms`、`/privacy`、`/pwa-install`，每筆含 `lastModified`、`changeFrequency`、`priority`，以及 `alternates.languages`（`zh-TW`／`en`／`zh-CN` 對應網址）。SHALL NOT 列入需登入頁、`/login`、`/register`、或 `/course/[id]`。`middleware.ts` 的 `matcher` SHALL 排除 `/sitemap.xml`。

#### Scenario: 取得 sitemap.xml
- **WHEN** 請求 `/sitemap.xml`
- **THEN** 回傳有效 XML，含 `/` 與 `/courses` 的 `<loc>`（絕對網址）與 `<xhtml:link rel="alternate" hreflang="...">`

#### Scenario: 不含受保護頁
- **WHEN** 檢視 `/sitemap.xml`
- **THEN** 不含任何 `/admin`、`/user`、`/dashboard`、`/course/` 開頭的網址

#### Scenario: 首頁權重最高
- **WHEN** 檢視 `/` 的 sitemap 條目
- **THEN** 其 `priority` 為 1.0

### Requirement: 結構化資料共用元件

系統 SHALL 提供可重用的 JSON-LD 輸出方式（如 `components/seo/json-ld.tsx`），於 Server Component 內以 `<script type="application/ld+json">` 直出。首頁 `/` SHALL 至少輸出 `Organization` 與 `WebSite` 兩個節點（含 `name`、`url`、`logo`），網址取自 `getSiteUrl()`。

#### Scenario: 首頁含 Organization / WebSite JSON-LD
- **WHEN** 爬蟲抓取 `/`
- **THEN** HTML 內含合法 JSON-LD，`@type` 含 `Organization` 與 `WebSite`，`url` 為站台絕對網址

#### Scenario: JSON-LD 為合法 JSON
- **WHEN** 解析頁面中的 `application/ld+json` 區塊
- **THEN** 可被 `JSON.parse` 成功解析，無語法錯誤
