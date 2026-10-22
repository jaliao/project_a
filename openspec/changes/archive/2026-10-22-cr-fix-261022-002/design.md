## Context

`npm run build` 的最後階段（"Generating static pages"）會對 Next.js 內部自動產生的特殊路由 `/_global-error` 進行靜態匯出。此路由對應的正是 `global-error.js` 機制：當 root layout（或其更上層）拋出未被任何 `error.js` 攔截的例外時，整個 React 樹（含 root layout 本身）都會被卸載，改由 `global-error.js` 接手渲染——因此 `global-error.js` **必須自帶 `<html>`/`<body>`**，不能假設 root layout 還存在。

本專案的路由結構是 i18n 驅動的：唯一的 layout 是 `app/[locale]/layout.tsx`（提供 `<html lang>`、`NextIntlClientProvider` 等），**根目錄 `app/` 下沒有 `app/layout.tsx`**。這與多數 Next.js 專案「`app/layout.tsx` 在根層」的預設假設不同。專案目前也沒有自訂 `app/global-error.tsx`，因此 build 時使用的是 Next.js 內部自動產生的預設 global-error 元件。

於 CR-FEAT-261021-004 驗證階段發現 `npm run build` 在這個內部路由的 prerender 階段以 `TypeError: Cannot read properties of null (reading 'useContext')` 崩潰；用 `git stash` 比對變更前程式碼（commit `a622f7f`）同樣重現，確認與該次變更無關。`npm run lint`、`tsc --noEmit`、以及 build 本身前段的「Compiled successfully」「Running TypeScript」皆正常，只卡在這個特定內部路由。

本次 Spec 撰寫階段另外在本機執行 `npm run build`（含清除 `.next` 快取後重跑）數次，皆未重現該崩潰（exit code 0）。可能原因：
- Turbopack 的靜態頁面產生為多 worker 並行（CR 描述中可見 "Generating static pages using 19 workers"），若崩潰與 worker 排程的 race condition 有關，不同機器的核心數/負載可能影響是否觸發。
- 本機與回報環境的 `node_modules`／Next.js 快取狀態可能有細微差異。

無論是否每次都能重現，**專案缺少根層 `global-error.tsx` 本身就是一個已知風險**（Next.js 官方文件明確要求：沒有 root layout 時應自訂 global-error 以避免依賴內部預設行為），且本專案已有 `app/not-found.tsx` 處理同類「root layout 不存在」問題的先例可直接比照。

## Goals / Non-Goals

**Goals:**
- 讓 `npm run build` 能完整跑完、exit code 0，不再出現 `/_global-error` 的 prerender 錯誤。
- 新增的 `app/global-error.tsx` 不依賴 next-intl、全站 CSS 或任何 Client Context，確保即便 root layout 本身壞掉，此頁面仍能獨立渲染。
- 維持與 `app/not-found.tsx` 一致的視覺風格與慣例（inline style、無 i18n、原生 `<a>`／按鈕）。

**Non-Goals:**
- 不處理個別頁面層級的錯誤邊界（`error.tsx`）——本專案目前無此需求，global-error 只處理「root layout 以上」層級的未攔截例外。
- 不追查 Turbopack 內部預設 global-error 元件崩潰的確切原始碼層級根因（屬 Next.js 內部實作細節，且官方規範本就要求自訂 global-error，不依賴其內部預設行為是正確做法，不需要深挖上游 bug）。
- 不改動 i18n 錯誤訊息顯示（global-error 情境下無法保證 next-intl provider 可用，固定使用繁體中文文案，比照 `app/not-found.tsx`）。

## Decisions

- **用自訂 `app/global-error.tsx` 取代 Next.js 內部預設元件，而非深入排查 Turbopack 內部崩潰原因。**
  理由：Next.js 官方規範本就建議/允許自訂 global-error，且本專案「無根層 layout」的結構原本就不該依賴框架內部預設行為；比照 `app/not-found.tsx` 的既有解法最省力、風險最低，且是正確的長期做法（框架升級後內部預設元件行為改變也不受影響）。
- **沿用 `app/not-found.tsx` 的「自帶最小 `<html>`/`<body>`、inline style、無 Provider 依賴」寫法。**
  理由：global-error 與根層 404 的處境相同——都可能在 root layout 無法使用的情況下渲染，必須自成一體。保持風格一致也降低維護負擔。
- **`app/global-error.tsx` 標記 `'use client'`，提供「重新嘗試」（呼叫 `reset()`）與「回到首頁」兩個操作。**
  理由：Next.js 規範要求 global-error 必須是 Client Component；`reset` 是框架提供的標準錯誤復原機制，`error.tsx`/`not-found.tsx` 慣例皆提供「返回首頁」作為保底路徑。
- **固定繁體中文文案，不使用 next-intl。**
  理由：global-error 渲染時無法保證任何 Provider（含 `NextIntlClientProvider`）仍存在，比照 `app/not-found.tsx` 的既有決策。

## Risks / Trade-offs

- [本機多次 build 未能重現原崩潰，無法 100% 確認此修法完全解決問題] → 新增 `app/global-error.tsx` 本身是 Next.js 官方建議的正確作法（消除對內部預設元件的依賴），即使崩潰與其他因素有關，此修法也不會造成新風險；`tasks.md` 的驗證步驟會要求連續多次執行 `npm run build` 確認穩定性，若仍重現崩潰則需另開 CR 深入排查 Turbopack 本身的問題。
- [固定中文文案、無 i18n，使用英文語系使用者看到的 global-error 頁面也是中文] → 可接受，global-error 是極端情況的最後防線（多數使用者終其使用都不會看到），比照 `app/not-found.tsx` 同一取捨。

## Migration Plan

- 純新增檔案，無資料庫或既有頁面變更，部署即生效。若需回退，直接刪除 `app/global-error.tsx` 即恢復 Next.js 內部預設行為（但會重新暴露原崩潰風險）。

## Open Questions

- 若實作後 `npm run build` 仍偶發崩潰（本機無法重現、但不排除與特定環境/負載相關），是否需要另外調整 Turbopack 靜態頁面產生的並行 worker 數量？此問題留待 apply 階段驗證結果決定是否需要追加處理。
