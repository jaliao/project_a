## Why

需求單 CR-SPEC-260828-006（提出人：廖柏嘉 Justin，2026-08-28）：

> 我在 google 搜尋「啟動靈人 啟動豐盛 啟動得勝」找不到我們的網站連結。可以協助我優化這個網站的 SEO 問題嗎？

現況盤點：

- **唯一有內容的公開頁是首頁 `/`**（其餘 `/login`、`/register`、`/terms`、`/privacy`、`/pwa-install` 為功能／法務頁；`/course/[id]` 為訪客頁但實際內容需登入）。全站沒有一頁在講「啟動靈人／啟動豐盛／啟動得勝」這三個課程，Google 自然無從索引到相關內容。
- **缺少技術 SEO 基礎建設**：無 `app/robots.ts`、無 `app/sitemap.ts`、`metadata` 無 `metadataBase`（OpenGraph／canonical 無法組出絕對網址、Next.js 會告警）、無 `title.template`、無 `keywords`、無 OpenGraph／Twitter card、無 `alternates`（canonical / hreflang）、無 JSON-LD 結構化資料。
- 首頁 `description` 僅重複站名，`<h1>` 與內文未涵蓋三個旗艦課程名稱（內文只提到「啟動靈人、啟動豐盛」，漏了「啟動得勝」）。

決策（2026-08-28 與提出人確認）：

1. **範圍＝技術 SEO ＋ 新增課程介紹公開頁**（不含 en／zh-CN 內容翻譯投入）。
2. **對外網域一律讀環境變數 `NEXT_PUBLIC_SITE_URL`，fallback `NEXTAUTH_URL`**，程式不寫死網域。

> 非目標：向 Google Search Console 提交網站、購買關鍵字廣告、外部連結經營——這些屬營運動作、不在程式碼變更範圍。本變更提供 GSC 提交所需的 sitemap 與 robots。

## What Changes

### 1. 站台 URL 單一來源

- 新增 `lib/utils/site-url.ts`：`getSiteUrl()` 依序取 `NEXT_PUBLIC_SITE_URL` → `NEXTAUTH_URL` → `'http://localhost:3000'`，去尾斜線。供 `metadataBase`／`robots.ts`／`sitemap.ts`／JSON-LD 共用。
- `.env.example`：新增 `NEXT_PUBLIC_SITE_URL`（正式對外 HTTPS 網域）與註解說明。

### 2. 根 metadata 強化（`app/[locale]/layout.tsx` 的 `generateMetadata`）

- `metadataBase: new URL(getSiteUrl())`。
- `title`：`{ default: '啟動事工｜啟動靈人・啟動豐盛・啟動得勝 課程平台', template: '%s — 啟動事工' }`。
- `description`：一段涵蓋「啟動靈人／啟動豐盛／啟動得勝」與事工定位的說明文字（i18n key）。
- `keywords`：`['啟動事工','啟動靈人','啟動豐盛','啟動得勝','啟動課程','門徒訓練']`。
- `openGraph`：`type: website`、`siteName: 啟動事工`、`locale: zh_TW`、`url: '/'`、`title`／`description`、`images: ['/icon-512']`（暫用既有圖示，日後可換 OG 圖）。
- `twitter`：`card: 'summary'`、`title`／`description`。
- `alternates`：`canonical: '/'`、`languages: { 'zh-TW': '/', 'en': '/en', 'zh-CN': '/zh-CN' }`（hreflang）。
- `robots`：`{ index: true, follow: true }`（明確宣告允許索引）。
- 內頁若已自行設定 `title` 字串（如 `'提問管理 — 啟動事工'`）維持不變；新設 `template` 只影響未帶站名後綴的頁面。**本次不逐頁重寫既有 title**。

### 3. `app/robots.ts`

- 允許所有 UA 抓取；`disallow` 非公開區塊（`/api/`、`/admin/`、`/user/`、`/dashboard/`、`/onboarding`、`/reset-password`、`/change-password`、`/account-suspended`、`/invites`、`/messages`、`/notifications`）。
- `sitemap: '${getSiteUrl()}/sitemap.xml'`、`host: getSiteUrl()`。

### 4. `app/sitemap.ts`

- 列出公開可索引頁：`/`（priority 1.0）、`/courses`（0.9）、`/terms`、`/privacy`、`/pwa-install`（各 0.3）。
- 每筆帶 `lastModified`、`changeFrequency`，以及 `alternates.languages`（zh-TW／en／zh-CN）對應網址。
- 不含需登入頁、不含 `/login`／`/register`（低價值、避免稀釋）、不含 `/course/[id]`（內容需登入、視為 thin）。

### 5. 新增公開「課程介紹」頁 `/courses`

- 路由：`app/[locale]/(guest)/courses/page.tsx`（Server Component，`export const dynamic` 不設、盡量可靜態或 ISR）。
- **資料驅動**：以 `getActiveCourses()`（`lib/data/course-catalog.ts`，已存在）取得啟用中的 `CourseCatalog`，依 `sortOrder` 逐一渲染為 `<section>`，`label` 作 `<h2>`、`description` 作內文；`description` 為空時以 i18n 預設簡介文字兜底。
- **固定引言區**：一段介紹「啟動事工」與三個旗艦課程（啟動靈人／啟動豐盛／啟動得勝）定位與適合對象的文字（i18n key），確保三個關鍵字都出現在可見內文與標題中，即使 DB 尚無對應 catalog 或 description。
- **CTA**：「報名 / 登入」連往 `/login`、「找回帳號」連往 `/recover-account`。
- **頁面 metadata**：專屬 `title`（走 template → `課程介紹 — 啟動事工`）、`description`、`alternates.canonical: '/courses'` 與 hreflang。
- **JSON-LD**（`<script type="application/ld+json">`，Server Component 直出）：
  - `Organization`（name、url、logo）。
  - `WebSite`（name、url）。
  - `ItemList` 內含每個啟用課程的 `Course`（`name` = label、`description`、`provider` = 啟動事工 Organization）。
- 首頁 `(guest)/page.tsx` 與 footer 新增「課程介紹」連結指向 `/courses`；首頁功能說明區文字補上「啟動得勝」，`<h1>`／副標語補關鍵字（i18n）。

### 6. 免登入路由註冊

- `lib/auth/route-access.ts`：`PUBLIC_PAGES` 新增 `{ match: 'exact', path: '/courses', reason: '課程介紹（SEO 公開頁）' }`。

### 7. i18n 文案（CLAUDE.md #12）

- 新增命名空間 `seo`（root description／keywords 說明）與 `courses`（課程介紹頁引言、各課程兜底簡介、CTA、metadata）加入 `messages/zh-TW.json`，並補 `messages/en.json`（可為精簡英文）；`messages/zh-CN.json` 由 `npm run gen:zh-cn` 產生。
- 首頁既有硬編碼字串在本次**僅就補關鍵字的段落** key 化（`<h1>` 副標、功能卡「課程管理」描述、新增的「課程介紹」連結），其餘維持現狀，避免擴大範圍。

## Capabilities

### New Capabilities

- `seo-metadata`：站台 URL 單一來源、根 metadata（metadataBase／title template／description／keywords／OpenGraph／Twitter／canonical／hreflang／robots 指示）、`app/robots.ts`、`app/sitemap.ts`。
- `public-course-intro`：免登入 `/courses` 課程介紹頁（資料驅動 + 固定引言 + JSON-LD），首頁／footer 導引連結。

### Modified Capabilities

- `public-route-registry`：`PUBLIC_PAGES` 新增 `/courses`。

## Impact

- **Affected code**
  - 新增：`lib/utils/site-url.ts`、`app/robots.ts`、`app/sitemap.ts`、`app/[locale]/(guest)/courses/page.tsx`（＋必要的 JSON-LD 子元件）
  - 修改：`app/[locale]/layout.tsx`（`generateMetadata` 大幅擴充）、`app/[locale]/(guest)/page.tsx`（連結＋關鍵字文案）、`lib/auth/route-access.ts`（＋`/courses`）
  - 修改：`messages/zh-TW.json`、`messages/en.json`（新 `seo`／`courses` 命名空間、首頁補字）；`messages/zh-CN.json` 重新產生
  - 修改：`.env.example`（`NEXT_PUBLIC_SITE_URL`）
- **Database**：無 schema 變更、無 migration（`/courses` 讀既有 `CourseCatalog`）。
- **middleware**：`matcher` 已排除 `sitemap.xml`／`robots.txt`？——`robots.txt`／`sitemap.xml` 由 App Router 特殊檔案產生，須確認 `middleware.ts` 的 `matcher` 不會攔截（現況已排除 `manifest.webmanifest`／`icon` 等，需一併加入 `robots.txt`、`sitemap.xml`）。
- **i18n**（CLAUDE.md #12）：新 key 進 `zh-TW`／`en`，`zh-CN` 由 `gen:zh-cn` 產生。
- **Docs**（CLAUDE.md #9）：新增免登入頁面，於 `doc/學員手冊.md`（或 README-AI 路由結構）補一句「`/courses` 課程介紹（免登入）」；三份操作手冊功能面無實質流程變動，僅 README-AI 路由章節與（如有）手冊「系統簡介」段落補充。版本標註：有改到手冊才 bump。
- **Version**（CLAUDE.md #7）：apply 時 `config/version.json` patch +1、`updatedAt` 當日。
- **Dependencies**：無新增套件（JSON-LD 以純物件 + `JSON.stringify` 內嵌，不引 library）。
- **部署**：正式站需設定 `NEXT_PUBLIC_SITE_URL`（正式對外網域）；上線後由營運方將 `sitemap.xml` 提交 Google Search Console（非程式碼工作，於回報中提示）。
