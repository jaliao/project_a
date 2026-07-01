## Why

專案未提供任何 `not-found.tsx`，因此 `notFound()`（例如造訪不存在的 `/course/347`）會落到 Next.js 預設 404——無版面/主題、無導覽，畫面「一片黑」，使用者卡住無法離開。至少需提供友善的 404 頁與「回到首頁」按鈕。

## What Changes

- 新增 **`app/[locale]/not-found.tsx`**：友善 404 版面（標題＋說明＋「回到首頁」按鈕），套用既有 `[locale]` layout（主題/字型）與 i18n；「回到首頁」以 `@/i18n/navigation` 連至 `/`。
- 新增 **`app/not-found.tsx`** 根層備援：處理完全未匹配（locale 外）之網址；因無 root layout 需自帶最小 `<html><body>` 與回首頁連結。
- i18n：新增 `notFound` 文案（標題/說明/回到首頁；回到首頁可沿用既有 `common.backToHome`）。

## Capabilities

### New Capabilities

- `not-found-page`: 自訂 404 頁面（友善版面＋回到首頁），涵蓋 `[locale]` 內 `notFound()` 與根層未匹配網址。

### Modified Capabilities

（無）

## Impact

- `app/[locale]/not-found.tsx`（新）、`app/not-found.tsx`（新，根層備援）
- `messages/zh-TW.json`／`messages/en.json`：新增 `notFound.*`（zh-CN 由 OpenCC 重產）
- 無 DB migration；純前端頁面
