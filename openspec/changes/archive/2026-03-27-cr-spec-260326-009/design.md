## Context

OOM 發生在 `web-1` 容器，heap 達 ~4GB 後觸發 Fatal Error。`docker-compose.dev.yml` 目前設定 `--max-old-space-size=4096`，Next.js dev 模式長時間運行後 HMR 模組快取積累導致不足。

同時 `createNotification` 在每次課程操作後呼叫，其內部執行 `revalidatePath('/', 'layout')`，這會強制整個 App Router layout 樹重新驗證。隨著通知整合範圍擴大（開課/取消/審核/結業/申請），幾乎每個使用者操作都觸發全站重渲染。

## Goals / Non-Goals

**Goals:**
- `package.json` dev script 啟用 Turbopack（`next dev --turbopack`），降低 HMR 記憶體積累
- `docker-compose.dev.yml` 提高 heap 上限至 6144 MB
- `app/actions/notification.ts` 三處 `revalidatePath('/', 'layout')` 改為精確路徑

**Non-Goals:**
- 修改 `force-dynamic` 頁面（需逐頁評估 stale data 風險）
- 將直接 Prisma 呼叫移至 data layer（純 code style，不影響效能）
- 生產環境 memory 設定（prod 不用 HMR，OOM 原因不同）

## Decisions

### D1：Turbopack 取代 Webpack dev bundler

Next.js 16 Turbopack 在 dev 模式下記憶體用量比 Webpack 少 40-60%，且 HMR 速度更快。`--turbopack` 為穩定 flag（Next.js 15+），無需其他設定變更。

**風險：** Turbopack 與部分 Webpack 插件不相容，但本專案無自訂 webpack 設定，風險極低。

### D2：revalidatePath 精確化

`revalidatePath('/', 'layout')` 觸發根 layout 以下所有 segment 重新驗證。

替換策略：
- `markNotificationRead` / `markAllNotificationsRead`：只影響通知頁面 → 改為 `revalidatePath('/notifications')`
- `createNotification`：通知由 layout topbar 即時顯示（未讀 badge）→ 此處仍需觸發 layout，但改為較小範圍 `revalidatePath('/', 'layout')` 保留，因為 badge 計數在 layout 中

**實際上** `createNotification` 的 revalidatePath 作用是更新未讀 badge（在 layout 中）。如果移除，badge 不會即時更新。保留 `('/', 'layout')` 但僅在 `createNotification` 保留，`markNotificationRead` 和 `markAllNotificationsRead` 改精確路徑即可減少 2/3 的無謂 layout 觸發。

### D3：heap 6144 MB 為緩衝上限

容器主機若有 8GB+ RAM，6144 MB 留足餘量給 DB 和 OS。若主機 RAM 不足，可視情況調整。

## Risks / Trade-offs

- **Turbopack 相容性**：萬一有問題可改回 `"dev": "next dev"` 秒復原
- **revalidatePath 改動**：`markNotificationRead` 後 topbar badge 仍即時更新（因 read 操作不由 createNotification 觸發，已讀後 badge 減少靠 `markNotificationRead` 的 revalidatePath 觸發）→ 改為 `/notifications` 後 badge 更新會延遲至下次 layout 重整。若要保留即時，需保留 `('/', 'layout')`。建議先改，觀察 UX 後決定是否還原。

## Migration Plan

1. 修改 `package.json` dev script
2. 修改 `docker-compose.dev.yml` NODE_OPTIONS
3. 修改 `app/actions/notification.ts` revalidatePath
4. 重啟 dev 容器（`make dev-clean` 或重跑 `npm run dev`）
