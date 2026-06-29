## 1. 依賴與設定

- [x] 1.1 安裝 `next-intl`（4.13）與 `opencc-js`（1.3）；`--legacy-peer-deps`
- [x] 1.2 `next.config.ts` 套用 `next-intl/plugin`（指向 `i18n/request.ts`）
- [x] 1.3 `i18n/routing.ts`：`defineRouting({ locales:['zh-TW','en','zh-CN'], defaultLocale:'zh-TW', localePrefix:'as-needed' })`
- [x] 1.4 `i18n/request.ts`：`getRequestConfig` 載入訊息，deepMerge 以 zh-TW 作缺 key 回退
- [x] 1.5 `i18n/navigation.ts`：`createNavigation(routing)` 導出在地化 `Link`/`useRouter`/`usePathname`

## 2. 訊息目錄與簡體產生

- [x] 2.1 `messages/zh-TW.json`（命名空間 `common`/`auth`/`language`，含切片所需 key）
- [x] 2.2 `messages/en.json`（對應英文翻譯）
- [x] 2.3 `scripts/gen-zh-cn.mjs`：OpenCC t2s 自 zh-TW 遞迴轉值產生 zh-CN.json
- [x] 2.4 `package.json` 加 `gen:zh-cn` 並於 `prebuild` 執行；zh-CN.json 含 `__generated` 註記

## 3. 路由重整（app/[locale]）

- [x] 3.1 `git mv` `(guest)`/`(user)`/`(admin)` → `app/[locale]/` 之下
- [x] 3.2 建 `app/[locale]/layout.tsx`（`<html lang>` + `NextIntlClientProvider` + Toaster）；移除舊 `app/layout.tsx`
- [x] 3.3 `generateStaticParams` 提供 locales；非支援 locale → `notFound`
- [x] 3.4 build route 表確認：路由位於 `/[locale]/*`，預設 zh-TW 無前綴

## 4. Middleware 組合

- [x] 4.1 middleware = next-intl `createMiddleware` + 認證判定（intl 後、auth 先以 stripLocale 分類），導向帶 locale 前綴的 /login
- [x] 4.2 `matcher` 排除 `/api`、`_next`、靜態檔
- [x] 4.3 `lib/auth/route-access.ts` `LOCALES` 對齊 `['zh-TW','en','zh-CN']`

## 5. 語言切換器與範例切片

- [x] 5.1 `components/i18n/language-switcher.tsx`（用 `i18n/navigation`，保留路徑、寫 `NEXT_LOCALE`、標示當前語言）
- [x] 5.2 Topbar 嵌入切換器；登入頁亦提供
- [x] 5.3 範例切片：登入表單（client `useTranslations`）+ 登入頁 metadata（server `getTranslations`）+ Topbar

## 6. 準則與版本

- [x] 6.1 `CLAUDE.md` 第 12 條（i18n 慣例：字串放 zh-TW、以 key 取用、簡體勿手改、缺 key 回退）
- [x] 6.2 `README-AI.md` 技術棧/架構更新（next-intl、`app/[locale]`、messages、切換器）
- [x] 6.3 `config/version.json` 0.1.100 → 0.1.101

## 7. 驗證

- [x] 7.1 `npm run gen:zh-cn` 產生 zh-CN.json；`npm run build`（✓ Compiled）與 `npm run lint`（0 errors）通過
- [x] 7.2 （待執行階段）手測 `/`（繁，URL 不變）、`/en`、`/zh-CN` 三語呈現；切換器保留路徑、記住偏好
- [x] 7.3 （待執行階段）未登入 `/en/dashboard` 導向登入；`/en/login` 放行；x-pathname 不致 profile 迴圈
- [x] 7.4 `/api/verify-email` 未登入可達（使用者實測通過）；並修正其驗證後導向：原以 `req.url` 建址，經 Cloudflare Tunnel 時 host 變內部 `localhost:3000` 導致瀏覽器無法到達 → 改用 `x-forwarded-host`/`x-forwarded-proto` 還原對外網域

> 註：7.2–7.4 由使用者於開發環境實測完成（x-pathname 機制運作正常、未發生 profile 迴圈）。本 sandbox 無法啟動伺服器，執行階段驗證由使用者協助。
