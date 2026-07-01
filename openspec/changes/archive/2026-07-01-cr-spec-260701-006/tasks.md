## 1. i18n 文案

- [x] 1.1 `messages/zh-TW.json`／`messages/en.json` 新增 `notFound`（`title`、`desc`）；回首頁沿用 `common.backToHome`
- [x] 1.2 `npm run gen:zh-cn` 重產 `messages/zh-CN.json`

## 2. [locale] 404 頁

- [x] 2.1 `app/[locale]/not-found.tsx`：client component（套 layout 之 i18n provider/主題）；置中卡片（404＋標題＋說明）＋「回到首頁」`<Link href="/">`（`@/i18n/navigation`）＋`Button`

## 3. 根層備援 404

- [x] 3.1 `app/not-found.tsx`：自帶最小 `<html lang="zh-TW"><body>`；inline style＋靜態繁體＋原生 `<a href="/">`（eslint-disable，因無 provider）

## 4. 文件與版本

- [x] 4.1 `config/version.json` → 0.1.114；README-AI 同步（系統頁面，手冊略）

## 5. 驗證

- [x] 5.1 `npm run build`（✓ Compiled）、`npm run lint`（0 errors）、`npm run gen:zh-cn` 通過
- [ ] 5.2 （執行階段）造訪 `/course/<不存在>` 顯示友善 404＋回首頁；`/en` 亦正確；未匹配網址有備援
