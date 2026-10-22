# global-error-page Specification

## Purpose
TBD - created by archiving change cr-fix-261022-002. Update Purpose after archive.

## Requirements

### Requirement: 根層全站錯誤邊界頁面

系統 SHALL 提供自訂 `app/global-error.tsx`（根層，位於 `[locale]` 之外），於 root layout 或其更上層發生未被任何 `error.tsx` 攔截的例外時渲染。此頁面 SHALL 自帶最小 `<html>`/`<body>`，不依賴 next-intl `NextIntlClientProvider`、全站 CSS 或任何其他 Client Context，確保即便 root layout 本身無法正常運作，此頁面仍能獨立渲染。

#### Scenario: root layout 以上層級發生未攔截例外

- **WHEN** root layout（或其上層）拋出未被任何 `error.tsx` 攔截的例外
- **THEN** 系統卸載整個 React 樹並渲染自訂的 `app/global-error.tsx`，顯示繁體中文錯誤訊息，不依賴任何 Provider

#### Scenario: 提供重新嘗試與回到首頁操作

- **WHEN** 使用者看到全站錯誤邊界頁面
- **THEN** 頁面提供「重新嘗試」按鈕（呼叫 Next.js 提供的 `reset()` 復原目前渲染樹）與「回到首頁」連結（導向 `/`）

### Requirement: 建置階段可完整產出此內部路由

`npm run build` 對 Next.js 內部自動產生的 `/_global-error` 路由進行靜態匯出時 SHALL 成功完成，不得因缺少自訂 `global-error.tsx` 而在 prerender 階段崩潰導致 build 以非 0 狀態結束。

#### Scenario: 正式建置完整跑完

- **WHEN** 執行 `npm run build`
- **THEN** build 完整跑完並以 exit code 0 結束，不出現 `/_global-error` 的 prerender 錯誤
