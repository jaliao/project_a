## Why

需求單 CR-SPEC-260902-002（提出人：廖柏嘉 Justin，2026-09-02，所屬專案 P26021 Project A 啟動靈人系統）：**「變更 LOGO 和 FOOTER」**。原文：

- **Logo**：用「A 那個圖」。
- **Footer**：分「登入前」與「登入後」；選單內容由執行者草擬；樣式參考 shadcnblocks [footer2](https://www.shadcnblocks.com/block/footer2)（附 `Footer2` 元件程式碼參考）。

使用者澄清（2026-09-02，AskUserQuestion）：

1. **「A 那個圖」＝現有品牌標記 `BrandIconMark`**（`lib/pwa/brand-icon.tsx`，藍底（`#2563eb`）圓角＋白色字母「A」，目前用於 favicon／PWA icon）。Topbar 與 Footer 的 logo 皆改用此標記，右側仍保留「啟動事工」文字。
2. **登入前 Footer 只出現在「公開行銷頁」**：首頁 `/`、公開課程介紹 `/courses`、服務條款 `/terms`、隱私政策 `/privacy`（登入／註冊／找回帳號等表單頁不放）。
3. **登入後 Footer 與訪客頁「相同的多欄大 Footer」**（不再是目前僅一行 `v{version} · {updatedAt}` 的精簡版）。
4. **版本號併入 Footer 底部列**（與版權、法律連結同一列），不獨立成行。
5. **不放社群媒體連結**（`react-icons` 未安裝、專案規範用 Tabler；本次無社群圖示需求）。

現況：

- **Logo（品牌標記）**：Topbar（`components/layout/topbar.tsx` L95–108）與公開首頁 Header（`app/[locale]/(guest)/page.tsx` L40–54）各自**內嵌同一段抽象線條 `<svg>`**（非「A」），加 `{tc('appName')}`／「啟動事工」文字。公開課程頁 Header（`app/[locale]/(guest)/courses/page.tsx`）僅文字。三處重複、皆非品牌 A。
- **品牌 A 標記**：`lib/pwa/brand-icon.tsx` `BrandIconMark({ size, rounded })`——inline style（無 Tailwind、無 `'use client'`，server／client 皆可用），供 `app/icon.tsx`／`app/apple-icon.tsx`／PWA 192／512 共用。DOM 使用時需外層固定尺寸盒（其 root 為 `width/height:100%`）。
- **Footer**：`components/layout/footer.tsx`——`<footer className="py-4">` 內單行 `v{version} · {updatedAt}`（讀 `config/version.json`），對齊 `APP_MAX_WIDTH`（`mx-auto w-full max-w-[1280px]`，`lib/utils.ts`）。僅由 `app/[locale]/(user)/layout.tsx` 與 `app/[locale]/(admin)/layout.tsx` 於 `<main>` 之後渲染。
- **公開行銷頁的臨時 footer**：`(guest)/page.tsx` L129–140、`(guest)/courses/page.tsx` L137–152 各自內嵌一段 `<footer class="border-t px-6 py-4 text-center text-xs">`（© 2026 啟動事工＋服務條款／隱私政策／…連結）；`terms`／`privacy` 頁**無 footer**。
- **`(guest)/layout.tsx`**：薄 passthrough，被所有免登入頁共用（含登入／註冊），**不適合**直接塞共用 Footer。
- **spec `footer-version-info`**：明訂「登入後（`(user)`／`(admin)`）SHALL 顯示 `v{version} · {updatedAt}`；**免登入頁 SHALL NOT 顯示此 Footer**」——本 CR 需修正此條。
- **i18n**：next-intl，`messages/zh-TW.json` 為唯一事實來源，元件不得寫死中文（server 用 `getTranslations`、client 用 `useTranslations`）；目前**無 `footer` 命名空間**。`appName` = `common.appName`（「啟動事工」）。

## What Changes

1. **共用品牌標記元件 `components/layout/brand-logo.tsx`（新）**：以 `BrandIconMark` 呈現藍底白「A」＋「啟動事工」文字（`common.appName`）。Topbar、公開首頁 Header、公開課程頁 Header 一律改用此元件，移除各自內嵌的抽象 `<svg>`。
2. **共用 Footer 元件改寫為多欄版面**（`components/layout/footer.tsx`，參考 shadcnblocks footer2）：
   - **品牌欄**：`BrandLogo` ＋ 一段簡短系統描述。
   - **連結區塊**：由執行者草擬的 2–3 個分類（僅站內公開路由，無社群連結）——見 design。
   - **底部列**：`© {年份} 啟動事工` ＋ 法律連結（服務條款／隱私政策）＋ **`v{version} · {updatedAt}`**（併入同一列，資料仍取 `config/version.json`）。
   - 版面對齊 `APP_MAX_WIDTH`，響應式（手機單／雙欄堆疊、桌機多欄）。
3. **Footer 出現範圍**：
   - **登入後**：`(user)`／`(admin)` layout 沿用（同一個多欄 Footer 取代舊精簡版）。
   - **登入前**：僅在 `/`、`/courses`、`/terms`、`/privacy` 四個公開行銷頁引入共用 `<Footer />`，移除 `page.tsx`／`courses/page.tsx` 內嵌的臨時 footer，`terms`／`privacy` 新增 footer。**不**加進 `(guest)/layout.tsx`（避免登入／註冊等表單頁出現）。
4. **文案 i18n**：新增 `footer` 命名空間（`messages/zh-TW.json` ＋ `messages/en.json`；`zh-CN` 由 `gen:zh-cn` 重產）——描述、各連結區塊標題與連結文字、版權格式、法律連結文字。

## Impact

- **Affected specs**：
  - `brand-logo`（**新**）：共用品牌標記元件（A 標記＋系統名），Topbar／公開頁 Header／Footer 共用。
  - `site-footer`（**新**）：共用多欄 Footer 的結構、出現範圍（公開行銷頁 ＋ 登入後全頁）、底部列內容（版權／法律連結／版本號）、選單內容草擬版。
  - `footer-version-info`（**MODIFIED**）：`v{version} · {updatedAt}` 改由共用 Footer 底部列呈現；顯示範圍擴及公開行銷頁；移除「免登入頁 SHALL NOT 顯示」。
- **Affected code**：`components/layout/brand-logo.tsx`（新）、`components/layout/footer.tsx`（改寫）、`components/layout/topbar.tsx`（換 logo）、`app/[locale]/(guest)/page.tsx`（換 logo＋改用 `<Footer/>`）、`app/[locale]/(guest)/courses/page.tsx`（換 logo＋改用 `<Footer/>`）、`app/[locale]/(guest)/terms/page.tsx`＋`privacy/page.tsx`（新增 `<Footer/>`）、`messages/zh-TW.json`＋`messages/en.json`（`footer` 命名空間）、`doc/` 三手冊、`config/version.json`。
- **無 DB schema 變更**；純前端（元件／版面／i18n）。
- **相容性**：`config/version.json` 讀取欄位與格式不變（`v{version} · {updatedAt}`），只是呈現位置改到底部列。`BrandIconMark` 既有簽章不動（僅新增 DOM 使用端）。
- **非目標**：不改 favicon／PWA icon 產生邏輯、`BRAND_COLOR`、`APP_MAX_WIDTH`；不改 Topbar 其他按鈕與行為；不在登入／註冊／找回帳號／onboarding 等表單頁加 Footer；不引入 `react-icons` 或社群連結；不改 `app-shell`「Footer 對齊內容框」既有規範（新 Footer 仍對齊）。
