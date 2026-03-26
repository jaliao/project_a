## Why

大量程式碼變更（cr-spec-260326-012、cr-spec-260326-013）後，Turbopack 的 chunk hash 重新計算，但瀏覽器的 HMR runtime 仍持有舊的 chunk 參照，導致 `Failed to load chunk app_layout_tsx_*.js` RuntimeError，頁面完全白屏。目前沒有 Makefile target 可快速清除 `.next` 快取並重啟 dev server。

## What Changes

- 新增 `make next-clean` Makefile target：清除 `.next` 目錄並重新執行 `npm run dev`
- 清除 `.next` 快取（立即修復當前白屏錯誤）

## Capabilities

### New Capabilities
- （無）

### Modified Capabilities
- （無）—— 此為開發環境操作修復，不改動任何應用程式邏輯或 spec

## Impact

- `Makefile` — 新增 `next-clean` target
- 執行 `make next-clean` 即可清除 Turbopack stale chunk 並重啟 dev server
