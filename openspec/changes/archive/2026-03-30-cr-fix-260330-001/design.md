## Context

Prisma Studio 預設呼叫系統瀏覽器（`xdg-open` on Linux）。WSL2 無桌面環境，`xdg-open` 不存在，導致 Node.js 拋出未處理的 `ENOENT` 錯誤並以非零 exit code 結束，make 判定失敗。

## Goals / Non-Goals

**Goals:**
- 修正三個 studio make 目標在 WSL2 下的崩潰問題

**Non-Goals:**
- 不自動設定 WSL2 瀏覽器整合
- 不修改 Prisma 設定檔

## Decisions

**加 `--browser none` 旗標**：Prisma Studio CLI 官方支援此旗標，停用瀏覽器自動開啟，Studio 仍正常啟動並監聽 port，使用者手動開啟 URL 即可。

## Risks / Trade-offs

- 無風險：純 CLI 旗標，不影響 Studio 功能本身
