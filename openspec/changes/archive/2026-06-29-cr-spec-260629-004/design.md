## Context

Next.js 16 App Router，無任何 i18n。UI 文案寫死繁體中文（~114 檔、~1,415 行），`app/layout.tsx` 寫死 `<html lang="zh-TW">`。路由已重組為 `app/(guest|user|admin)/*`，`lib/auth/route-access.ts` 已預留 `stripLocale`（path-prefix 路線）。決策：next-intl + path-prefix `as-needed`（zh-TW 預設無前綴、`/en`、`/zh-cn`），簡體由 OpenCC 自繁體產生，本期做基礎建設 + 範例切片。

## Goals / Non-Goals

**Goals:**
- 導入 next-intl 完整基礎建設：locale 路由、middleware 組合、訊息目錄、provider、`<html lang>` 在地化。
- 建立翻譯使用慣例（server `getTranslations` / client `useTranslations`），遷移一塊範例切片驗證。
- 簡體 `zh-CN.json` 由 `zh-TW.json` 經 OpenCC 自動產生（不手工維護）。
- 漸進遷移：未翻譯字串 fallback 至 zh-TW，行為不退化。

**Non-Goals:**
- 不翻譯全部 1,415 行字串（依慣例後續逐步遷移）。
- 不在地化使用者產生內容（課程名、會員名等）。
- 不在地化 `app/api/*`。

## Decisions

- **函式庫與設定（next-intl）：**
  - `i18n/routing.ts`：`defineRouting({ locales: ['zh-TW','en','zh-CN'], defaultLocale: 'zh-TW', localePrefix: 'as-needed' })`。
  - `i18n/request.ts`：`getRequestConfig` 載入 `messages/<locale>.json`，並以 zh-TW 作 **fallback**（非預設語言缺 key 時回退繁體，支援漸進遷移；設定 `getMessageFallback`/`onError` 不因缺 key 中斷）。
  - `i18n/navigation.ts`：由 `createNavigation(routing)` 導出在地化 `Link`/`useRouter`/`usePathname`。
- **目錄重整：** 將 `(guest)`／`(user)`／`(admin)` 移至 `app/[locale]/` 之下；`app/api/` 留在根、不在地化。`<html lang={locale}>`/`<body>` 與 `NextIntlClientProvider` 置於 `app/[locale]/layout.tsx`（依 next-intl 官方 App Router 設定）；原 `app/layout.tsx` 依該設定調整（html 移至 locale layout）。**此 root/locale layout 整合為主要驗證點**，apply 時對照安裝版本之 next-intl 文件並以 build 驗證。
- **Middleware 組合：** 以 next-intl `createMiddleware(routing)` 處理語言協商/前綴（含 `NEXT_LOCALE` cookie）；其回傳若為 redirect/rewrite 則沿用，否則接續既有認證判定。認證沿用 `route-access`（已 `stripLocale`）以 locale-無關路徑分類；`isPublicRoute`/`isGuestRoute` 不受前綴影響。`matcher` 排除 `/api`、`_next`、靜態檔。
- **訊息目錄與簡體產生：**
  - `messages/zh-TW.json`＝**唯一事實來源**（繁體）；`messages/en.json`＝英文翻譯；`messages/zh-CN.json`＝**產生物**。
  - `scripts/gen-zh-cn.mjs`（OpenCC，如 `opencc-js`，t2s）讀 zh-TW 遞迴轉值產生 zh-CN.json；`package.json` 加 `gen:zh-cn`，並於 `prebuild` 自動執行。zh-CN.json **committed 但禁止手改**（檔頭/註記說明）。
  - 命名空間：依功能分（如 `common`、`auth`、`nav`…）。
- **語言切換器：** client 元件，用 `i18n/navigation` 的 `useRouter`/`usePathname` 切換 locale 並保留當前路徑；置於 Topbar（登入後）與 guest 頁。
- **範例切片（建立慣例）：** 登入頁（guest，client：`useTranslations`）、`app/[locale]/layout` 之 metadata（server：`getTranslations`）、Topbar + 語言切換器、共用 `common` 命名空間字串。
- **route-access 對齊：** `LOCALES` 由 `['zh','zh-TW','en']` 改為 `['zh-TW','en','zh-CN']`。

## Risks / Trade-offs

- [root/[locale] layout 與 Next 16 整合細節] → 依 next-intl 官方設定；apply 以 build + 手測 `/`、`/en`、`/zh-cn` 驗證；必要時調整 root layout 結構。
- [next-intl 與 Next 16 版本相容] → 安裝時確認支援版本；不相容則固定相容版號。
- [非預設語言 URL 改變（加前綴）] → 預設 zh-TW 維持無前綴、URL 不變；其他語言新前綴為新增非破壞。
- [middleware 串接順序錯誤導致認證失效] → 明確：intl 先、auth 後；以 stripLocale 分類；手測未登入導向在三語下皆正確。
- [OpenCC 轉換品質/詞彙差異] → 抽查；保留「需要時於 zh-CN 覆寫」機制（產生後可加 override 層，後續視需要）。
- [大量檔案搬移] → 以 `git mv` 保留歷史；分段 commit（deps/config、路由搬移、訊息/切換器、切片）。

## Migration Plan

1. 安裝 `next-intl` 與 OpenCC 套件。
2. 建 `i18n/routing|request|navigation.ts`、`messages/zh-TW.json`、`en.json`、`scripts/gen-zh-cn.mjs`、`gen:zh-cn`/`prebuild`。
3. `next.config` 套用 `next-intl/plugin`。
4. `git mv` 路由群組至 `app/[locale]/`；調整 root/locale layout（html/lang/provider）。
5. middleware 改為 intl + auth 組合；`route-access` LOCALES 對齊。
6. 語言切換器 + 範例切片遷移。
7. `CLAUDE.md`/`README-AI.md` 慣例；`config/version.json` +1。
8. build/lint + 手測 `/`、`/en`、`/zh-cn` 與未登入導向、切換器。
回退：移除 [locale] 段與 next-intl plugin/middleware，還原 root layout。

## Open Questions

- zh-CN 是否需「人工覆寫層」（少數 OpenCC 不理想詞）——本期先全自動，保留後續加 override。
- 範例切片是否擴及更多頁——預設登入頁 + Topbar + common，apply 時可微調。
