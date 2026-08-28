# 設計說明

## 決策 1：對外網域讀 env，不寫死

`lib/utils/site-url.ts`：

```ts
export function getSiteUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXTAUTH_URL ||
    'http://localhost:3000'
  return raw.replace(/\/+$/, '')
}
```

- `NEXT_PUBLIC_SITE_URL` 才會 inline 進 client bundle；`robots.ts`／`sitemap.ts`／`generateMetadata` 皆在 server 端執行，兩個 env 都讀得到。JSON-LD 於 Server Component 產生，同樣讀得到。
- 與既有 `lib/utils/app-url.ts` 分工：`app-url.ts` 給寄信／route handler 導向（對「使用者可達位址」敏感，dev tunnel 情境多）；`site-url.ts` 給「對外正式門面網址」（SEO 用，正式站固定）。不合併，避免語意混淆。

## 決策 2：root `generateMetadata` 擴充，內頁 title 不逐頁重寫

- 設 `title.template = '%s — 啟動事工'`、`title.default = '啟動事工｜啟動靈人・啟動豐盛・啟動得勝 課程平台'`。
- 既有內頁多數已用完整字串（`export const metadata = { title: 'XXX — 啟動事工' }`）——這些是「字串」形式，Next.js **不套用 template**，維持原樣即可，不需改。
- 少數只給短 title 的頁面會自動套上 ` — 啟動事工` 後綴，屬改善、無害。
- `alternates.languages` 用相對路徑（`metadataBase` 會補成絕對）：`{ 'zh-TW': '/', 'en': '/en', 'zh-CN': '/zh-CN' }`。

## 決策 3：`robots.ts` 的 disallow 清單

以「非公開 route group / 功能頁」為準，寧可多擋：

```
disallow: ['/api/', '/admin/', '/user/', '/dashboard', '/onboarding',
           '/reset-password', '/change-password', '/account-suspended',
           '/invites', '/messages', '/notifications', '/recover-account',
           '/forgot-password']
allow: ['/']
```

- `/login`、`/register` 不 disallow（無害），但也不進 sitemap。
- `host` 與 `sitemap` 皆用 `getSiteUrl()`。

## 決策 4：`sitemap.ts` 內容與 hreflang

```ts
const base = getSiteUrl()
const pages = [
  { path: '/', priority: 1.0, changeFrequency: 'weekly' },
  { path: '/courses', priority: 0.9, changeFrequency: 'monthly' },
  { path: '/terms', priority: 0.3, changeFrequency: 'yearly' },
  { path: '/privacy', priority: 0.3, changeFrequency: 'yearly' },
  { path: '/pwa-install', priority: 0.3, changeFrequency: 'yearly' },
]
// 每筆：url = base + path，lastModified = new Date(),
// alternates.languages = { 'zh-TW': base+path, en: base+'/en'+path, 'zh-CN': base+'/zh-CN'+path }
```

- `/en` 前綴：`/` 的 en 版是 `/en`（不是 `/en/`）；其他頁 `/en/courses` 等。以字串組即可。
- 不動態列 `/course/[id]`（需登入才有內容，且數量大、易被判 thin/soft-404）。

## 決策 5：`/courses` 頁——資料驅動 + 固定引言雙保險

結構：

1. **Header**（沿用首頁 header 樣式：站名 + 登入連結）。
2. **引言區**（i18n `courses.intro`）：一段話講「啟動事工」的門徒訓練定位，明確點名啟動靈人 / 啟動豐盛 / 啟動得勝三課程與適合對象。這段是固定文案，確保三個關鍵字必定出現在 `<h1>`／可見內文，**不依賴 DB 有無資料**。
3. **課程清單**：`await getActiveCourses()` → 依 `sortOrder` map 成 `<section>`：
   - `<h2>{label}</h2>`
   - `<p>{description ?? t(`courses.fallback.${slugify(label)}`) ?? t('courses.fallbackGeneric')}</p>`
   - 兜底：`description` 常為空，i18n 提供三個已知課程名的預設簡介（key 對照 label 文字），未命中則用泛用兜底句。
4. **CTA 區**：報名/登入（`/login`）、找回帳號（`/recover-account`）。
5. **Footer**（沿用首頁 footer）。
6. **JSON-LD**：見決策 6。

- 不需登入、不呼叫 `auth()`；可被 Next 靜態化或 ISR（若 `getActiveCourses` 走 DB 則為 dynamic，可接受——內容仍可被爬）。
- 已登入使用者開 `/courses` **不強制轉走**（比照 terms/privacy；SEO 頁對所有人可見）。

## 決策 6：JSON-LD 結構化資料

Server Component 內直接輸出：

```tsx
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
/>
```

`jsonLd` 為 `@graph` 陣列：

- `{ '@type': 'Organization', '@id': base + '/#org', name: '啟動事工', url: base, logo: base + '/icon-512' }`
- `{ '@type': 'WebSite', '@id': base + '/#website', name: '啟動事工', url: base, publisher: { '@id': base + '/#org' } }`
- `{ '@type': 'ItemList', itemListElement: activeCourses.map((c, i) => ({ '@type': 'ListItem', position: i+1, item: { '@type': 'Course', name: c.label, description: c.description ?? <兜底>, provider: { '@id': base + '/#org' } } })) }`

首頁 `(guest)/page.tsx` 亦加 `Organization` + `WebSite`（可抽 `components/seo/json-ld.tsx` 共用）。

## 決策 7：middleware matcher 排除 robots/sitemap

`middleware.ts` 的 `config.matcher` 目前排除 `manifest.webmanifest|sw\.js|icon-192|...`。App Router 產生的 `/robots.txt` 與 `/sitemap.xml` 是根層特殊路由，若被 next-intl middleware 套上 locale 前綴會 404。→ 在 matcher 的負向前瞻加入 `robots\.txt|sitemap\.xml`。

## 非目標

- 不提交 Google Search Console、不做關鍵字廣告、不經營外部反向連結（營運動作）。
- 不製作專屬 OG 分享圖（暫用 `/icon-512`；日後可另開變更換 1200×630 圖）。
- 不逐頁重寫既有頁面的 `title`/`description`。
- 不把 `/course/[id]` 或其他需登入頁納入 sitemap。
- 不投入 en／zh-CN 的課程內容翻譯（`courses` 命名空間 en 值可為精簡英文，zh-CN 由 OpenCC 產生）。
