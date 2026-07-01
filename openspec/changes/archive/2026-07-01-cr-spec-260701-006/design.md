## Context

- 無任何 `not-found.tsx` → `notFound()` 落到 Next.js 預設 404（無樣式，「一片黑」）。
- `app/[locale]/layout.tsx` 提供 `<html lang><body><NextIntlClientProvider>`；`[locale]` 內的 `notFound()` 會渲染最近的 `not-found.tsx` 並套此 layout。
- 無 root `app/layout.tsx`（CLAUDE.md 第 12 點）。
- i18n 導向用 `@/i18n/navigation` 的 `Link`；`common.backToHome` 已存在。

## Goals / Non-Goals

**Goals:**
- 造訪不存在資源（如 `/course/347`）時顯示友善 404，含「回到首頁」按鈕，套用既有主題。
- 根層未匹配網址亦有備援 404（不空白）。

**Non-Goals:**
- 不改 `notFound()` 觸發邏輯；不做 error boundary（`global-error`）——本批聚焦 404。

## Decisions

1. **`app/[locale]/not-found.tsx`**（主要）：server component，套 `[locale]` layout（自動有 html/body/provider/主題）。以 `getTranslations` 取 `notFound.*` 文案，含 `<Link href="/">` 回首頁按鈕（`@/i18n/navigation`，locale 感知）。版面採現有 UI（置中卡片＋Button）。
2. **`app/not-found.tsx`**（根層備援）：處理 locale 外未匹配網址。因無 root layout，需**自帶最小 `<html><body>`**；提供純 `<a href="/">` 回首頁（不依賴 i18n provider，避免無 provider 崩潰），文字用預設繁體。
3. **i18n**：`messages/zh-TW.json`／`en.json` 新增 `notFound`（`title`、`desc`；回首頁沿用 `common.backToHome`）；zh-CN 由 `npm run gen:zh-cn` 重產。
4. 樣式沿用 Tailwind／`Button`，與 `course-login-prompt` 類似的置中卡片風格。

## Risks / Trace-offs

- 根層 `app/not-found.tsx` 自帶 `<html>` 需避免與 `[locale]` layout 衝突（兩者不同觸發路徑，不會同時套用）。
- 根層備援不套 i18n provider，故用靜態繁體文字（避免 `useTranslations` 在無 provider 環境報錯）。
- 純前端、無 migration，風險低。
