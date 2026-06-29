## Why

系統目前 UI 文案全為寫死的繁體中文（約 114 檔、1,415 行字串），`<html lang>` 固定 `zh-TW`，無任何 i18n 機制。需導入多語系以支援繁體中文（預設）、英文、簡體中文。字串量龐大無法一次翻完，故本期建立**完整 i18n 基礎建設與慣例**並遷移**一塊範例切片**，其餘字串依慣例逐步遷移。上次重構（`public-route-registry`）已預留 `stripLocale`，採 path-prefix 路線。

## What Changes

- 導入 **next-intl**（App Router 首選），採 **path-prefix `as-needed`**：預設 `zh-TW` 無前綴、`/en`、`/zh-cn`。語言集：`zh-TW`（預設）、`en`、`zh-CN`。
- **目錄重整**：將 `(guest)`／`(user)`／`(admin)` route group 移至 `app/[locale]/` 之下；`app/api/` 維持不在地化。新增 `app/[locale]/layout.tsx`（提供 `NextIntlClientProvider`、設定 `<html lang>`）。
- **中介層組合**：next-intl middleware（語言協商/前綴）與既有認證 middleware 串接；認證的免登入判定沿用 `route-access`（已 `stripLocale`），`LOCALES` 對齊為 `zh-TW`/`en`/`zh-CN`。
- **訊息目錄**：`messages/zh-TW.json`（繁體＝**唯一事實來源**）、`messages/en.json`（英文）、`messages/zh-CN.json`（**由 zh-TW 經 OpenCC 自動繁轉簡產生**，不手工維護）；新增產生腳本與 `package.json` script。
- **語言切換器**：UI 元件（置於 Topbar 與 guest 頁），切換後保留當前路徑、寫入偏好。
- **範例切片遷移**：將登入頁、Topbar 與一組共用 UI 字串改用 `useTranslations`/`getTranslations`，建立翻譯使用慣例（server 與 client component 各一示範）。
- **開發準則**：`CLAUDE.md` 新增 i18n 慣例（新增字串放 `messages/zh-TW.json`、以 key 取用、不再寫死中文；簡體勿手改）。

> 既有未遷移字串維持顯示繁體中文（fallback），系統行為不退化；遷移為漸進式。

## Capabilities

### New Capabilities

- `i18n-routing`: locale 前綴路由（path-prefix as-needed、預設 zh-TW）、next-intl 與認證 middleware 組合、`<html lang>` 在地化、語言協商與 fallback。
- `i18n-messages`: 訊息目錄結構與翻譯使用慣例（zh-TW 為來源、en 翻譯、zh-CN 由 OpenCC 產生）、新增字串的開發規範。
- `language-switcher`: 語言切換 UI——切換語言並保留當前路徑、記住偏好。

### Modified Capabilities

（`public-route-registry` 的 `LOCALES` 由 `['zh','zh-TW','en']` 對齊為 `['zh-TW','en','zh-CN']`，屬實作層調整，既有「locale 前綴容忍」需求不變。）

## Impact

- 新依賴：`next-intl`、OpenCC 轉換套件（如 `opencc-js`，建置期用）。
- 目錄/路由：`app/[locale]/(guest|user|admin)/*` 整批移動（URL 結構改變——預設語言不變、其他語言加前綴）；root `app/layout.tsx` 與 `app/[locale]/layout.tsx` 調整（html/lang 由 locale layout 提供）。
- i18n 設定：新增 `i18n/`（next-intl request/routing 設定）、`messages/`、`scripts/gen-zh-cn.*`。
- middleware：改為 next-intl + 認證組合；`lib/auth/route-access.ts` `LOCALES` 對齊。
- 範例切片：登入頁、Topbar、語言切換器、共用字串。
- 準則：`CLAUDE.md` 新增 i18n 規範；`README-AI.md` 架構/技術棧更新；`config/version.json` patch +1。
- 風險：路由重整牽動廣（middleware／layout／連結）；預設語言 URL 須維持不變；OpenCC 轉換品質需抽查；漸進遷移期繁簡英混雜需有 fallback。
