## 1. 站台 URL 單一來源

- [x] 1.1 新增 `lib/utils/site-url.ts`：`getSiteUrl()` 依序 `NEXT_PUBLIC_SITE_URL` → `NEXTAUTH_URL` → `http://localhost:3000`，去尾斜線
- [x] 1.2 `.env.example`：新增 `NEXT_PUBLIC_SITE_URL=`（正式對外 HTTPS 網域）與註解（SEO：sitemap/robots/canonical/OG 絕對網址來源）

## 2. 根 metadata 擴充

- [x] 2.1 `app/[locale]/layout.tsx` `generateMetadata`：加入 `metadataBase: new URL(getSiteUrl())`
- [x] 2.2 `title`：設為 i18n `seo.defaultTitle`（含站名＋三課程關鍵字）。**偏離 spec**：不設 `title.template`——經查 Next.js 會對子頁字串 `title` 也套 template，而既有 ~25 頁已用完整字串「XXX — 啟動事工」，加 template 會造成站名後綴重複；改為僅提供關鍵字豐富的預設 title，需要後綴的內頁沿用既有「自帶站名字串」慣例（`/courses` 即 `課程介紹 — 啟動事工`）
- [x] 2.3 `description`（i18n `seo.description`）、`keywords`（`啟動事工`／`啟動靈人`／`啟動豐盛`／`啟動得勝`／`啟動課程`／`門徒訓練`）
- [x] 2.4 `openGraph`（`type: 'website'`、`siteName: '啟動事工'`、`locale: 'zh_TW'`、`url: '/'`、`title`、`description`、`images: ['/icon-512']`）
- [x] 2.5 `twitter`（`card: 'summary'`、`title`、`description`）
- [x] 2.6 `alternates`：`canonical: '/'`、`languages: { 'zh-TW': '/', 'en': '/en', 'zh-CN': '/zh-CN' }`
- [x] 2.7 `robots: { index: true, follow: true }`
- [x] 2.8 因未設 template，既有內頁字串 title 完全不受影響（抽查 `admin/support-inquiries` = `提問管理 — 啟動事工`、`user/[spiritId]` = `首頁 — 啟動事工` 皆維持原樣）

## 3. robots.ts

- [x] 3.1 新增 `app/robots.ts`：`rules` allow `/`、disallow `['/api/','/admin/','/user/','/dashboard','/onboarding','/reset-password','/change-password','/account-suspended','/invites','/messages','/notifications','/recover-account','/forgot-password']`
- [x] 3.2 `sitemap: getSiteUrl() + '/sitemap.xml'`、`host: getSiteUrl()`
- [x] 3.3 `middleware.ts` `config.matcher` 負向前瞻加入 `robots\.txt`

## 4. sitemap.ts

- [x] 4.1 新增 `app/sitemap.ts`：頁面清單 `/`（1.0/weekly）、`/courses`（0.9/monthly）、`/terms`、`/privacy`、`/pwa-install`（0.3/yearly）
- [x] 4.2 每筆 `url = getSiteUrl() + path`、`lastModified: new Date()`、`changeFrequency`、`priority`、`alternates.languages`（zh-TW = base+path、en = base+'/en'+path、zh-CN = base+'/zh-CN'+path；`/` 的 en 為 `/en`）
- [x] 4.3 `middleware.ts` `config.matcher` 負向前瞻加入 `sitemap\.xml`
- [x] 4.4 確認不含任何受保護路徑、`/login`、`/register`、`/course/[id]`

## 5. 結構化資料共用元件

- [x] 5.1 新增 `components/seo/json-ld.tsx`：接收物件、以 `<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />` 輸出（Server Component 安全）
- [x] 5.2 提供 `orgJsonLd()` / `websiteJsonLd()` 工具（`components/seo/` 或 `lib/seo.ts`），網址取自 `getSiteUrl()`

## 6. 免登入 /courses 課程介紹頁

- [x] 6.1 `lib/auth/route-access.ts`：`PUBLIC_PAGES` 新增 `{ match: 'exact', path: '/courses', reason: '課程介紹（SEO 公開頁）' }`
- [x] 6.2 新增 `app/[locale]/(guest)/courses/page.tsx`（Server Component，不呼叫 `auth()` 轉走）
  - `export async function generateMetadata`：`title` = `${t('metaTitle')} — 啟動事工`（自帶站名字串，比照 pwa-install）、`description`（`courses.metaDescription`）、`alternates.canonical: '/courses'`、hreflang、openGraph、twitter
  - Header（站名 + `/login` 連結）
  - 固定引言區（i18n `courses.intro*`）：`<h1>` + 內文，明確含「啟動靈人」「啟動豐盛」「啟動得勝」與事工定位／適合對象
  - 課程清單：`const courses = await getActiveCourses()`；依 `sortOrder` map 成 `<section>`：`<h2>{label}</h2>` + `<p>{description ?? 兜底 i18n}</p>`
  - CTA：`/login`（報名/登入）、`/recover-account`（找回帳號）
  - Footer（沿用首頁樣式：© / 服務條款 / 隱私政策）
  - JSON-LD：`@graph` = [Organization, WebSite, ItemList(Course…)]，`getSiteUrl()` 組網址；`getActiveCourses()` 為空時 ItemList 省略、仍輸出 Organization/WebSite
- [x] 6.3 i18n 兜底簡介：`courses.fallback` 對「啟動靈人」「啟動豐盛」「啟動得勝」各一句預設簡介 + `courses.fallbackGeneric`

## 7. 首頁補強

- [x] 7.1 `app/[locale]/(guest)/page.tsx`：`<h1>` 副標／功能說明文案補上「啟動得勝」，三個課程名稱皆出現於可見文字（改用 i18n key）
- [x] 7.2 首頁新增指向 `/courses` 的連結（主視覺 CTA 區或 footer），文字如「課程介紹」（i18n）
- [x] 7.3 首頁 `metadata`（既有 `export const metadata`）調整為與 root 一致的描述，或移除讓 root default 生效；加入首頁 JSON-LD（Organization + WebSite）

## 8. i18n 文案

- [x] 8.1 `messages/zh-TW.json`：新增 `seo`（`description`）與 `courses`（`metaTitle`／`metaDescription`／`introHeading`／`introBody`／`fallback.*`／`fallbackGeneric`／`ctaEnroll`／`ctaRecover`／`homeLink`）；首頁補字對應 key
- [x] 8.2 `messages/en.json`：補對應英文（可精簡）
- [x] 8.3 `npm run gen:zh-cn` 重新產生 `messages/zh-CN.json`
- [x] 8.4 三檔 JSON 合法性確認（`npm run build` 或 `node -e "require(...)"`）

## 9. 文件與版本

- [x] 9.1 `README-AI.md` 路由結構章節（`ai-context/03-*` 或對應檔）補「`/courses` 課程介紹（免登入，SEO）」、`app/robots.ts`／`app/sitemap.ts`
- [x] 9.2 `doc/學員手冊.md`「系統簡介」段落為登入後會員視角、未列公開頁網址，`/courses` 屬對外行銷頁非學員流程 → **略過**，三份手冊皆不動、不 bump 手冊版本
- [x] 9.3 `config/version.json`：0.1.175 → 0.1.176，`updatedAt` = 2026-08-28

## 10. 驗證

- [x] 10.1 `npm run lint`（無新增 error）
- [x] 10.2 `npm run build`（編譯成功、TypeScript 通過、`prebuild` gen:zh-cn 正常）
- [x] 10.3 以 build 產物驗證（本機 project_a dev DB 容器未啟動、無法起 dev server）：`.next/server/app/robots.txt.body` = `Allow: /` ＋ 13 條 `Disallow`（含 `/admin/`、`/user/`）＋ `Sitemap:` 絕對網址 ＋ `Host:`
- [x] 10.4 以 build 產物驗證：`.next/server/app/sitemap.xml.body` 為合法 XML，含 `/`（priority 1）與 `/courses`（0.9）絕對 `<loc>` 與 `<xhtml:link hreflang>` alternates；無 `/admin`／`/user`／`/course/` 條目
- [x] 10.5 程式層驗證：root `generateMetadata` 編譯通過（`metadataBase`/OG/canonical/hreflang/robots 皆設）；首頁 `<JsonLd data={graphJsonLd([orgJsonLd(), websiteJsonLd()])} />`。未起 server 檢視實際 HTML（無 DB/dev server）
- [x] 10.6 程式層驗證：`/[locale]/courses` route build 註冊成功（`ƒ`）；引言區為靜態 i18n（`introHeading` `<h1>` + `introBody`，三關鍵字硬性包含）；`descFor` 處理 null/空 description；JSON-LD `courses.length > 0 ? [ItemList(Course)] : []` 空陣列保護。未起 server 檢視實際渲染
- [x] 10.7 程式層驗證：`courses/page.tsx` 未呼叫 `auth()`／`redirect()`；`PUBLIC_PAGES` 已含 `/courses`（exact），`stripLocale('/en/courses')` → `/courses` → `isPublicRoute` true。未起 server 實測
