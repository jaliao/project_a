## Context

- **`lib/pwa/brand-icon.tsx`**
  ```tsx
  export const BRAND_COLOR = '#2563eb'
  export function BrandIconMark({ size, rounded = true }: { size: number; rounded?: boolean }) {
    // <div style={{ width:'100%', height:'100%', display:'flex', alignItems/justify:'center',
    //   background: BRAND_COLOR, borderRadius: rounded ? size*0.2 : 0 }}>
    //   <span style={{ fontSize: size*0.5, fontWeight:700, color:'#fff', fontFamily:'sans-serif' }}>A</span>
  }
  ```
  無 `'use client'`、純 JSX＋inline style → server／client 皆可 import。root 為 `width/height:100%`，DOM 使用需外層固定尺寸盒。

- **`components/layout/topbar.tsx`**（`'use client'`，`useTranslations('nav'|'common')`，`useRouter`）：L89–109 `<button onClick={() => router.push(homeUrl)} aria-label={t('home')} className="flex min-w-0 flex-1 items-center gap-2">` 內＝抽象 `<svg className="h-5 w-5 shrink-0">` ＋ `<span className="truncate text-lg font-semibold">{tc('appName')}</span>`。

- **`app/[locale]/(guest)/page.tsx`**（async server，`getTranslations`，已處理「已登入 → redirect」）：L39–55 `<header className="flex items-center justify-between px-6 py-4 border-b">` > `<div className="flex items-center gap-2 font-semibold text-lg">` 內＝同一抽象 `<svg className="h-5 w-5">` ＋「啟動事工」；右側 `<Link href="/login">`。L128–140 內嵌 `<footer className="border-t px-6 py-4 text-center text-xs text-muted-foreground">`（© 2026 啟動事工 · 服務條款 · 隱私政策 · 課程 · 安裝 App）。

- **`app/[locale]/(guest)/courses/page.tsx`**（async server）：L85 `<header className="flex items-center justify-between border-b px-6 py-4">`（僅「啟動事工」文字，無 svg）。L137–152 內嵌 `<footer>`（© 2026 啟動事工 · 服務條款 · 隱私政策 · 返回首頁）。

- **`app/[locale]/(guest)/terms/page.tsx` / `privacy/page.tsx`**：sync server component，`<div className="min-h-screen bg-background"><div className="mx-auto max-w-3xl px-6 py-12">…</div></div>`，**無 footer**。

- **`components/layout/footer.tsx`**（sync server，`import versionInfo from '@/config/version.json'`）：`<footer className="py-4"><div className={cn(APP_MAX_WIDTH, 'px-4 text-center text-xs text-muted-foreground sm:px-6')}>v{version} · {updatedAt}</div></footer>`。由 `(user)/layout.tsx`、`(admin)/layout.tsx` 於 `<main>` 後渲染。

- **`app/[locale]/(guest)/layout.tsx`**：`export default function GuestLayout({children}) { return <>{children}</> }`（薄 passthrough，所有免登入頁共用）。

- **`lib/utils.ts`**：`export const APP_MAX_WIDTH = 'mx-auto w-full max-w-[1280px]'`。

- **i18n**：`messages/zh-TW.json`（唯一事實來源）＋ `messages/en.json`；`messages/zh-CN.json` 由 `npm run gen:zh-cn`（`prebuild` 亦跑）。server 元件 `getTranslations`、client 元件 `useTranslations`。locale 感知連結用 `@/i18n/navigation` 的 `Link`。目前無 `footer` 命名空間；`common.appName` = 「啟動事工」。

- **spec `footer-version-info`**：「登入後頁面 SHALL 顯示 `v{version} · {updatedAt}`…**免登入頁 SHALL NOT 顯示此 Footer**」＋「`updatedAt` 隨 patch 同步」。

- **spec `app-shell`**：「Footer 的內容 SHALL 對齊 1280px 置中容器」「1280 以單一共用常數定義供 layout／Topbar／Footer 共用」——新 Footer 須續守（用 `APP_MAX_WIDTH`）。

## Goals / Non-Goals

**Goals**
1. 全站品牌 logo 統一為藍底白「A」標記（`BrandIconMark`）＋「啟動事工」，抽成共用 `BrandLogo` 元件，Topbar／公開頁 Header／Footer 共用。
2. 共用 Footer 改為 shadcnblocks footer2 風格的多欄版面（品牌欄＋連結區塊＋底部列），對齊 `APP_MAX_WIDTH`、響應式。
3. 版本號 `v{version} · {updatedAt}` 併入 Footer 底部列（與版權、法律連結同列）。
4. Footer 出現在：公開行銷頁（`/`、`/courses`、`/terms`、`/privacy`）＋ 所有登入後頁（`(user)`／`(admin)`）。
5. 全部文案走 i18n（新 `footer` 命名空間），零寫死中文。

**Non-Goals**
- 不改 favicon／PWA icon（`app/icon.tsx` 等）、`BRAND_COLOR`、`BrandIconMark` 既有簽章、`APP_MAX_WIDTH`。
- 不在登入／註冊／找回帳號／reset／forgot／onboarding／change-password／account-suspended／pwa-install 等頁加 Footer。
- 不引入 `react-icons`、不加任何社群媒體連結／圖示。
- 不改 Topbar 其他按鈕、右側選單、`homeUrl` 邏輯。
- 不改 `(guest)/layout.tsx`（維持薄 passthrough）。
- 不動 `app-shell` 的「Footer 對齊內容框」既有條款（僅沿用）。

## Decisions

### D1 — 共用品牌標記元件 `components/layout/brand-logo.tsx`（新）

`'use client'`（用 `useTranslations('common')` 取 `appName`，且需能在 client 的 Topbar 內使用；於 server／async 元件中作為 client island 渲染沒問題）。**純呈現**，不含連結／按鈕（由各呼叫端自行包 `<Link>`／`<button>`）。

```tsx
'use client'
import { useTranslations } from 'next-intl'
import { BrandIconMark } from '@/lib/pwa/brand-icon'
import { cn } from '@/lib/utils'

type Props = {
  /** icon 邊長 px，預設 24；text 尺寸由 className 控制 */
  size?: number
  /** 只顯示 A 標記、不顯示文字 */
  iconOnly?: boolean
  className?: string
  textClassName?: string
}

export function BrandLogo({ size = 24, iconOnly = false, className, textClassName }: Props) {
  const t = useTranslations('common')
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <span className="inline-flex shrink-0" style={{ width: size, height: size }}>
        <BrandIconMark size={size} />
      </span>
      {!iconOnly && (
        <span className={cn('truncate font-semibold', textClassName)}>{t('appName')}</span>
      )}
    </span>
  )
}
```

- 尺寸盒 `style={{ width, height }}` 收斂 `BrandIconMark` 的 `100%` root（避免撐滿父層）。
- `textClassName` 讓呼叫端調字級（Topbar `text-lg`、公開 Header `text-lg`、Footer 預設）。

### D2 — Topbar 換 logo

`topbar.tsx` L95–108 的抽象 `<svg>` ＋ `<span>{tc('appName')}</span>` → `<BrandLogo size={20} textClassName="text-lg" />`。外層 `<button onClick={() => router.push(homeUrl)} aria-label={t('home')} className="flex min-w-0 flex-1 items-center gap-2">` **不動**（`BrandLogo` 內已 `gap-2`，可把 button 的 `gap-4`→維持、或讓 BrandLogo 貼齊；保留 button className，BrandLogo 自身 `inline-flex items-center gap-2`）。`tc`（`common`）若不再他用可留。

### D3 — 公開頁 Header 換 logo

- `(guest)/page.tsx` L40–54：`<div className="flex items-center gap-2 font-semibold text-lg">` ＋ `<svg>` ＋「啟動事工」→ 整塊換 `<BrandLogo textClassName="text-lg" />`（外層若要連回首頁可包 `<Link href="/">`，本次維持現狀不加連結以縮小 diff，或包 `<Link>`——見 tasks，採「包 `<Link href="/">`」讓 logo 可點）。
- `(guest)/courses/page.tsx` L85–92 Header 內「啟動事工」文字 → `<BrandLogo textClassName="text-lg" />`（外層包 `<Link href="/">`）。

### D4 — 共用 Footer 改寫（多欄，shadcnblocks footer2 風格）

`components/layout/footer.tsx` 改為 **async server component**：
```tsx
import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import versionInfo from '@/config/version.json'
import { BrandLogo } from '@/components/layout/brand-logo'
import { cn, APP_MAX_WIDTH } from '@/lib/utils'

type FooterLink = { key: string; href: string }
type FooterSection = { titleKey: string; links: FooterLink[] }

// 選單內容（草擬版，僅站內公開路由；日後於此單一處調整）
const SECTIONS: FooterSection[] = [
  {
    titleKey: 'sectionExplore',
    links: [
      { key: 'linkHome', href: '/' },
      { key: 'linkCourses', href: '/courses' },
      { key: 'linkInstallApp', href: '/pwa-install' },
    ],
  },
  {
    titleKey: 'sectionLegal',
    links: [
      { key: 'linkTerms', href: '/terms' },
      { key: 'linkPrivacy', href: '/privacy' },
    ],
  },
]

const LEGAL_LINKS: FooterLink[] = [
  { key: 'linkTerms', href: '/terms' },
  { key: 'linkPrivacy', href: '/privacy' },
]

export async function Footer() {
  const t = await getTranslations('footer')
  const year = new Date().getFullYear()

  return (
    <footer className="border-t">
      <div className={cn(APP_MAX_WIDTH, 'px-4 py-10 sm:px-6')}>
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {/* 品牌欄（跨 2 欄） */}
          <div className="col-span-2">
            <BrandLogo textClassName="text-base" />
            <p className="mt-3 max-w-xs text-sm text-muted-foreground">{t('description')}</p>
          </div>

          {SECTIONS.map((s) => (
            <nav key={s.titleKey} aria-label={t(s.titleKey)}>
              <h3 className="mb-3 text-sm font-semibold">{t(s.titleKey)}</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {s.links.map((l) => (
                  <li key={l.key}>
                    <Link href={l.href} className="hover:text-foreground">{t(l.key)}</Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        {/* 底部列：版權 · 法律連結 · 版本號（同一列，桌機橫排、手機堆疊） */}
        <div className="mt-8 flex flex-col gap-2 border-t pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>{t('copyright', { year })}</p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            {LEGAL_LINKS.map((l) => (
              <Link key={l.key} href={l.href} className="underline underline-offset-4 hover:text-foreground">
                {t(l.key)}
              </Link>
            ))}
            <span className="tabular-nums">v{versionInfo.version} · {versionInfo.updatedAt}</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
```

- **版面**：`grid-cols-2 md:grid-cols-4`——手機品牌欄佔滿、兩個連結區塊各半欄；桌機品牌欄佔 2 欄＋2 連結欄。footer2 的 `py-32`／`container` 對「App 內嵌」太重，改 `py-10` ＋ `APP_MAX_WIDTH`（守 `app-shell`）。
- **版本號**：字串格式 `v{version} · {updatedAt}` **不變**（`footer-version-info` 相容），只是位置移到底部列右段。
- **年份**：`new Date().getFullYear()` 動態（取代既有硬寫「2026」）。
- **連結**：`@/i18n/navigation` `Link`（locale 感知）。`SECTIONS` 為模組常數，內容＝草擬版，集中一處可改。

### D5 — Footer 出現範圍（不動 `(guest)/layout.tsx`）

- **登入後**：`(user)/layout.tsx`、`(admin)/layout.tsx` 已 `import { Footer }` 並於 `<main>` 後渲染 → **零改動**（元件換皮即生效）。因 Footer 變 async server component，兩個 layout 本就是 async server component，`<Footer />` 直接 await 渲染 OK。
- **登入前（僅 4 個公開行銷頁）**：
  - `(guest)/page.tsx`：刪除 L128–140 內嵌 `<footer>`，改在該位置渲染 `<Footer />`（import `@/components/layout/footer`）。
  - `(guest)/courses/page.tsx`：刪除 L137–152 內嵌 `<footer>`，改 `<Footer />`。
  - `(guest)/terms/page.tsx`、`(guest)/privacy/page.tsx`：於最外層 `min-h-screen` 容器內、內容 `<div>` 之後新增 `<Footer />`（頁面由 sync → 可維持 sync，async `<Footer/>` 作為子節點由 RSC 處理；若 lint／型別要求，將頁面函式改 `async`）。
  - 這 4 頁的既有「返回登入 / 返回首頁」頁內連結**保留**（footer 是額外全站導覽，不取代頁內返回）。
- **不加**：login／register／recover-account／reset-password／forgot-password／onboarding／change-password／account-suspended／pwa-install。

### D6 — i18n：`footer` 命名空間

`messages/zh-TW.json` 新增（`messages/en.json` 對應；`gen:zh-cn` 重產）：

| key | zh-TW | en |
| --- | --- | --- |
| `description` | 啟動事工線上系統——課程報名、學習歷程與社群連結。 | Chidao Ministry online platform — course enrollment, learning records, and community. |
| `sectionExplore` | 探索 | Explore |
| `sectionLegal` | 條款與隱私 | Legal |
| `linkHome` | 首頁 | Home |
| `linkCourses` | 課程介紹 | Courses |
| `linkInstallApp` | 安裝 App | Install app |
| `linkTerms` | 服務條款 | Terms of Service |
| `linkPrivacy` | 隱私政策 | Privacy Policy |
| `copyright` | © {year} 啟動事工．保留一切權利。 | © {year} Chidao Ministry. All rights reserved. |

- `appName` 沿用 `common.appName`（BrandLogo 內取），不在 `footer` 重複。
- 描述、`sectionExplore` 標題等為**草擬文案**，可再調。

### D7 — spec 連動

- `footer-version-info` **MODIFIED**「Footer 顯示版本與系統更新日期」：`v{version} · {updatedAt}` 改由**共用 Footer 的底部列**呈現；顯示範圍＝登入後全頁 **＋ 公開行銷頁（`/`、`/courses`、`/terms`、`/privacy`）**；刪除「免登入頁 SHALL NOT 顯示此 Footer」。「`updatedAt` 隨 patch 同步」需求不變。
- `brand-logo`（新）：共用品牌標記元件需求＋各使用點（Topbar／公開 Header／Footer）。
- `site-footer`（新）：多欄 Footer 結構、出現範圍、底部列、選單內容（草擬版）。

## Risks / Trade-offs

- **Footer 變 async server component**：`terms`／`privacy` 頁目前 sync——RSC 允許 sync 父渲染 async 子；若專案 lint／tsconfig 對此有意見，改頁面函式為 `async`（無副作用）。`(user)`／`(admin)`／`(guest)/page`／`courses/page` 本就 async。
- **`BrandLogo` 為 client component**：Footer（server）內含一個 client island；bundle 影響極小（僅 `useTranslations` ＋ inline-style mark）。若要純 server，可改為 `BrandLogo` 接 `label` prop 由呼叫端傳入 `appName`——本 CR 採 client 版以簡化呼叫端。
- **年份動態化**：跨年後自動更新，但也代表 SSR 時間依伺服器時區；可接受（footer 版權年份慣例）。
- **公開頁移除內嵌 footer 的連結差異**：舊 `(guest)/page.tsx` footer 有「安裝 App」「課程」連結、`courses/page.tsx` 有「返回首頁」——新共用 footer 的 `SECTIONS` 已涵蓋 首頁／課程／安裝 App／條款／隱私，功能不減。
- **選單內容為草擬**：使用者已授權「由你草擬」；`SECTIONS` 集中一處，日後調整成本低。
- **Topbar `gap` 視覺**：`BrandLogo` 自帶 `gap-2`，與 button 的 `gap-4`（logo 與右側按鈕群距離）不衝突；logo icon 由 20→視覺與原 `h-5 w-5` 一致。
- **i18n 缺 key 回退**：`en`／`zh-CN` 缺 key 會逐層回退繁體（`i18n/request.ts` deepMerge），漸進可接受；本 CR 一次補齊 zh-TW＋en。

## Migration Plan

1. 新增 `components/layout/brand-logo.tsx`。
2. 改寫 `components/layout/footer.tsx`（多欄 async server；版本號進底部列）。
3. `topbar.tsx` 換 `<BrandLogo />`。
4. `(guest)/page.tsx`、`(guest)/courses/page.tsx`：換 logo ＋ 內嵌 footer → `<Footer />`。
5. `(guest)/terms/page.tsx`、`(guest)/privacy/page.tsx`：加 `<Footer />`（必要時函式改 `async`）。
6. `messages/zh-TW.json` ＋ `messages/en.json` 加 `footer` 命名空間；`npm run gen:zh-cn`。
7. `npx eslint`（改動檔）＋ `npx tsc --noEmit` ＋ `npm run build`。
8. `doc/` 三手冊（logo／footer 描述）＋ `config/version.json` patch +1／`updatedAt`（rule 7）；`ai-context/03`、`ai-context/07`、`README-AI.md`。
9. 無 DB migration。回滾＝還原上述檔案。

## Open Questions

無。四項澄清（logo 來源＝BrandIconMark A、訪客 footer 僅公開行銷頁、登入後同款多欄 footer、版本號併底部列、無社群連結）已由使用者確認；選單內容由執行者草擬（見 D4／D6）。
