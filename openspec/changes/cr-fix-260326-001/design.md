## Context

Turbopack 開發模式下，大量程式碼變更後 chunk hash 重新生成，舊的 HMR bundle reference 失效。瀏覽器嘗試載入已不存在的 chunk 路徑，導致 `ChunkLoadError`。Makefile 目前有 `make dev-clean`（清理 Docker volumes）但無清除 `.next` 目錄的專用指令。

## Goals / Non-Goals

**Goals:**
- 提供 `make next-clean` 快速清除 `.next` 快取
- 清除當前 `.next` 快取修復白屏

**Non-Goals:**
- 不修改 Turbopack 設定或 Next.js 版本
- 不修改任何應用程式程式碼

## Decisions

### 新增 `make next-clean` target

**決定**：在 Makefile 新增 `next-clean` target，執行 `rm -rf .next`。不自動重啟 dev server（使用者自行執行 `npm run dev`）。

**理由**：清除 `.next` 是一個破壞性操作，不應與重啟自動串聯，避免非預期行為。

## Risks / Trade-offs

- 清除 `.next` 會刪除所有 Turbopack 快取，下次啟動 dev server 需完整重新編譯，速度較慢。

## Migration Plan

立即執行：`rm -rf .next`，再執行 `npm run dev`。
