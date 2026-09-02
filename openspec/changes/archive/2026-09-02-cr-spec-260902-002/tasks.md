## 1. 共用品牌標記元件 `components/layout/brand-logo.tsx`（新）

- [x] 1.1 建立檔案，標準檔首註解（元件名 `BrandLogo`、日期 `2026-09-02`、`cr-spec-260902-002：全站品牌 A 標記共用元件`）
- [x] 1.2 `'use client'`；`import { useTranslations } from 'next-intl'`、`import { BrandIconMark } from '@/lib/pwa/brand-icon'`、`import { cn } from '@/lib/utils'`
- [x] 1.3 Props：`{ size?: number（預設 24）; iconOnly?: boolean; className?: string; textClassName?: string }`
- [x] 1.4 結構：`<span className={cn('inline-flex items-center gap-2', className)}>` → 固定尺寸盒 `<span className="inline-flex shrink-0" style={{ width: size, height: size }}><BrandIconMark size={size} /></span>` ＋（`!iconOnly` 時）`<span className={cn('truncate font-semibold', textClassName)}>{t('appName')}</span>`（`t = useTranslations('common')`）
- [x] 1.5 不含 `<Link>`／`<button>`／onClick（純呈現）

## 2. 共用 Footer 改寫 `components/layout/footer.tsx`（多欄、async server）

- [x] 2.1 檔首註解更新：`Footer - 多欄版面（品牌欄／連結區塊／底部列含版本號）`、日期 `2026-09-02`、`cr-spec-260902-002`
- [x] 2.2 改為 `export async function Footer()`；import：`getTranslations`（`next-intl/server`）、`Link`（`@/i18n/navigation`）、`versionInfo`（`@/config/version.json`）、`BrandLogo`（`@/components/layout/brand-logo`）、`cn, APP_MAX_WIDTH`（`@/lib/utils`）
- [x] 2.3 模組常數 `SECTIONS: { titleKey; links: { key; href }[] }[]`：
  - `sectionExplore` → `linkHome`(`/`)、`linkCourses`(`/courses`)、`linkInstallApp`(`/pwa-install`)
  - `sectionLegal` → `linkTerms`(`/terms`)、`linkPrivacy`(`/privacy`)
- [x] 2.4 模組常數 `LEGAL_LINKS`：`linkTerms`(`/terms`)、`linkPrivacy`(`/privacy`)
- [x] 2.5 `const t = await getTranslations('footer')`；`const year = new Date().getFullYear()`
- [x] 2.6 外層 `<footer className="border-t">` > `<div className={cn(APP_MAX_WIDTH, 'px-4 py-10 sm:px-6')}>`
- [x] 2.7 上半 `<div className="grid grid-cols-2 gap-8 md:grid-cols-4">`：品牌欄 `col-span-2`（`<BrandLogo textClassName="text-base" />` ＋ `<p className="mt-3 max-w-xs text-sm text-muted-foreground">{t('description')}</p>`）＋ `SECTIONS.map` → `<nav aria-label={t(s.titleKey)}>` 內 `<h3 className="mb-3 text-sm font-semibold">{t(s.titleKey)}</h3>` ＋ `<ul className="space-y-2 text-sm text-muted-foreground">` 內 `<li><Link href={l.href} className="hover:text-foreground">{t(l.key)}</Link></li>`
- [x] 2.8 底部列 `<div className="mt-8 flex flex-col gap-2 border-t pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">`：`<p>{t('copyright', { year })}</p>` ＋ `<div className="flex flex-wrap items-center gap-x-4 gap-y-1">` 內 `LEGAL_LINKS.map` → `<Link className="underline underline-offset-4 hover:text-foreground">` ＋ `<span className="tabular-nums">v{versionInfo.version} · {versionInfo.updatedAt}</span>`
- [x] 2.9 移除舊的單行 `v{version} · {updatedAt}` 版面（`py-4` / 置中 `text-center`）

## 3. Topbar 換 logo `components/layout/topbar.tsx`

- [x] 3.1 `import { BrandLogo } from '@/components/layout/brand-logo'`
- [x] 3.2 L95–108 的抽象 `<svg>` ＋ `<span className="truncate text-lg font-semibold">{tc('appName')}</span>` → `<BrandLogo size={20} textClassName="text-lg" />`（外層回首頁 `<button onClick={() => router.push(homeUrl)} aria-label={t('home')} className="flex min-w-0 flex-1 items-center gap-2">` 不動）
- [x] 3.3 若 `tc`（`useTranslations('common')`）已無其他用途則移除該行；否則保留
- [x] 3.4 檔首註解補 `cr-spec-260902-002：品牌 logo 改用共用 BrandLogo（A 標記）`＋更新日期

## 4. 公開行銷頁：換 logo ＋ 內嵌 footer → 共用 `<Footer/>`

- [x] 4.1 `app/[locale]/(guest)/page.tsx`：`import { BrandLogo }` ＋ `import { Footer } from '@/components/layout/footer'`；頁首 `<div className="flex items-center gap-2 font-semibold text-lg">…<svg/>…啟動事工</div>` → `<Link href="/"><BrandLogo textClassName="text-lg" /></Link>`（`Link` 用既有 `next/link` 或 `@/i18n/navigation`，與該檔既有一致）
- [x] 4.2 `app/[locale]/(guest)/page.tsx`：刪除 L128–140 內嵌 `<footer className="border-t px-6 py-4 text-center text-xs …">…</footer>`，改為 `<Footer />`（置於 `</main>` 之後、最外層 `</div>` 之前）；若 `tPwa`／`tCourses` 因此無其他用途則一併清掉未使用變數
- [x] 4.3 `app/[locale]/(guest)/courses/page.tsx`：`import { BrandLogo }` ＋ `import { Footer }`；頁首品牌區「啟動事工」→ `<Link href="/"><BrandLogo textClassName="text-lg" /></Link>`
- [x] 4.4 `app/[locale]/(guest)/courses/page.tsx`：刪除 L137–152 內嵌 `<footer>`，改 `<Footer />`；清掉因此未使用的 i18n 變數（如 `t('backToHome')` 若僅 footer 用）
- [x] 4.5 `app/[locale]/(guest)/terms/page.tsx`：`import { Footer }`；於最外層 `<div className="min-h-screen bg-background">` 內、內容 `<div className="mx-auto max-w-3xl …">` 之後加 `<Footer />`；若型別／lint 需要，函式改 `export default async function TermsPage()`
- [x] 4.6 `app/[locale]/(guest)/privacy/page.tsx`：同 4.5 加 `<Footer />`
- [x] 4.7 確認這 4 頁的頁內「返回登入／返回首頁」連結保留不動
- [x] 4.8 `(user)/layout.tsx`、`(admin)/layout.tsx` 不需改（已 import 並渲染 `<Footer />`，async 相容）——確認即可

## 5. i18n：`footer` 命名空間

- [x] 5.1 `messages/zh-TW.json` 新增 `footer`：`description`「啟動事工線上系統——課程報名、學習歷程與社群連結。」／`sectionExplore`「探索」／`sectionLegal`「條款與隱私」／`linkHome`「首頁」／`linkCourses`「課程介紹」／`linkInstallApp`「安裝 App」／`linkTerms`「服務條款」／`linkPrivacy`「隱私政策」／`copyright`「© {year} 啟動事工．保留一切權利。」
- [x] 5.2 `messages/en.json` 對應英文（Explore／Legal／Home／Courses／Install app／Terms of Service／Privacy Policy／`© {year} Chidao Ministry. All rights reserved.`／description 英譯）
- [x] 5.3 `npm run gen:zh-cn` 重產 `messages/zh-CN.json`，確認 `footer.*` 有簡體
- [x] 5.4 全庫確認無元件寫死「啟動事工」footer 文案殘留（`(guest)/page.tsx`、`courses/page.tsx` 內嵌 footer 已移除）

## 6. 驗證

- [x] 6.1 `npx eslint components/layout/brand-logo.tsx components/layout/footer.tsx components/layout/topbar.tsx "app/[locale]/(guest)/page.tsx" "app/[locale]/(guest)/courses/page.tsx" "app/[locale]/(guest)/terms/page.tsx" "app/[locale]/(guest)/privacy/page.tsx"`：0 error（含 no-unused-vars）
- [x] 6.2 `npx tsc --noEmit`：0 error
- [x] 6.3 `npm run build`：`✓ Compiled successfully`（`prebuild` 會跑 `gen:zh-cn`）
- [x] 6.4 **（人工實測）** Topbar：logo 為藍底白「A」＋「啟動事工」，點擊回首頁如常；深色模式對比正常
- [x] 6.5 **（人工實測）** 登入後頁面：底部為多欄 Footer，底部列同時有「© {年} 啟動事工」、服務條款／隱私政策、`v{版本} · {日期}`；1280px 寬對齊主內容
- [x] 6.6 **（人工實測）** 公開頁：`/`、`/courses`、`/terms`、`/privacy` 皆顯示同一多欄 Footer；`/login`、`/register`、`/recover-account` 不顯示 Footer
- [x] 6.7 **（人工實測）** Footer 連結逐一點擊導向正確（`/`、`/courses`、`/pwa-install`、`/terms`、`/privacy`），locale 前綴（`/en`、`/zh-CN`）正確
- [x] 6.8 **（人工實測）** 手機寬度：Footer 品牌欄佔滿、連結區塊堆疊、底部列換行不溢出

## 7. 文件與版本號（rule 7 / 8 / 9）

- [x] 7.1 `doc/學員手冊.md`：若有提到頁尾／logo 之處補「頁尾為多欄選單（含版本號）」「品牌標記為『A』圖示」；檔首版本標註＋日期改當日
- [x] 7.2 `doc/老師手冊.md`／`doc/管理者操作手冊.md`：檔首更新註記同步（logo 改『A』標記、頁尾改多欄含版本號）；檔首版本＋日期同步
- [x] 7.3 `config/version.json`：`version` patch +1、`updatedAt` = 當日（`YYYY-MM-DD`）
- [x] 7.4 `ai-context/03-architecture.md`：新增 `components/layout/brand-logo.tsx`；`components/layout/footer.tsx` 改「多欄（品牌／連結／底部列含版本號）、亦用於公開行銷頁」；Topbar／公開頁 Header logo 改共用 `BrandLogo`
- [x] 7.5 `ai-context/07-current-tasks.md`「已完成」最前面追加：`cr-spec-260902-002 變更 LOGO 和 FOOTER（品牌 A 標記共用 BrandLogo／多欄 Footer 含版本號底部列／公開行銷頁與登入後共用）`
- [x] 7.6 `README-AI.md`：版本行更新
