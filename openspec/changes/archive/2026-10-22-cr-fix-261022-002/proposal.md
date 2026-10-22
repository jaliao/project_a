## Why

執行 `npm run build` 時，Next.js 自動產生的內部 `/_global-error` 頁面在靜態匯出階段崩潰，錯誤為 `TypeError: Cannot read properties of null (reading 'useContext')`，導致 build 以非 0 狀態結束（`Next.js build worker exited with code: 1`）。於 CR-FEAT-261021-004（LINE OAuth 登入）驗證階段發現；已用 `git stash` 比對變更前的原始碼（commit `a622f7f`）確認同樣重現，證實與該次變更無關，是既有問題。

專案沒有自訂 `app/global-error.tsx`，且沒有根層 `app/layout.tsx`（唯一的 root layout 位於 `app/[locale]/layout.tsx`，由 next-intl 提供 `<html>`/`<body>`）。Next.js 的 `global-error.js` 依官方規範會**取代** root layout，因此必須自帶 `<html>`/`<body>`，不能依賴 root layout（或其內的任何 Provider）仍能正常運作——這正是 root layout 本身或其上層發生錯誤時的最後防線。在缺少根層 layout、也沒有自訂 `global-error.tsx` 的情況下，Next.js 16.1.1 + Turbopack 內部自動產生的預設 global-error 元件於此結構下 prerender 失敗。

本專案已有相同性質的既有慣例可循：`app/not-found.tsx`（根層備援 404，見 `not-found-page` capability）同樣因「無 root layout」而自帶最小 `<html>`/`<body>`、不依賴任何 Provider（inline style、無 next-intl）。

## What Changes

- 新增根層 `app/global-error.tsx`（位於 `[locale]` 之外），比照既有 `app/not-found.tsx` 的慣例：自帶最小 `<html>`/`<body>`、不依賴 next-intl/CSS/任何 Client Context，取代 Next.js 內部自動產生的預設 global-error 頁面。
- 依 Next.js 規範，`global-error.tsx` 必須是 Client Component（`'use client'`），接收 `error`、`reset` 兩個 props，並提供「重新嘗試」（呼叫 `reset()`）與「回到首頁」兩個操作。
- 不改動既有 `app/[locale]/layout.tsx`、`app/not-found.tsx` 或任何其他路由層級錯誤處理（如個別頁面的 `error.tsx`，目前專案未使用）。

## Capabilities

### Added Capabilities

- `global-error-page`：根層全站錯誤邊界頁面，於 root layout（或其上層）發生無法攔截的錯誤時顯示，自帶最小版面不依賴任何 Provider。

## Impact

- 新檔：`app/global-error.tsx`（root level，Client Component）。
- 建置：修復 `npm run build` 的 `/_global-error` prerender 崩潰，使 build 能以 exit code 0 完整跑完。
- 不影響任何現有頁面的執行期行為（僅在發生未被捕捉的例外時才會渲染此頁面，正常使用情境下使用者不會看到）。
