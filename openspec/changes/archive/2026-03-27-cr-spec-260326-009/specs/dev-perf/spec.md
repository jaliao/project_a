## ADDED Requirements

### Requirement: 開發環境使用 Turbopack
開發腳本 SHALL 使用 Next.js Turbopack bundler 以降低 HMR 記憶體用量。

#### Scenario: dev script 使用 turbopack flag
- **WHEN** 開發者執行 `npm run dev`
- **THEN** 啟動的是 `next dev --turbopack` 而非標準 Webpack dev server

### Requirement: 開發容器 heap 上限提升至 6144 MB
`docker-compose.dev.yml` 的 `NODE_OPTIONS` SHALL 設定 `--max-old-space-size=6144`，為 HMR 記憶體積累提供足夠緩衝。

#### Scenario: 容器 heap 上限設定
- **WHEN** docker-compose 啟動 web 服務
- **THEN** Node.js 最大 heap 為 6144 MB

### Requirement: 通知已讀操作使用精確 revalidatePath
`markNotificationRead` 與 `markAllNotificationsRead` SHALL 使用 `revalidatePath('/notifications')` 而非 `revalidatePath('/', 'layout')`，避免觸發全站 layout 重渲染。

#### Scenario: 標記單則通知已讀後只刷新通知頁面
- **WHEN** 使用者呼叫 `markNotificationRead`
- **THEN** 只有 `/notifications` 路徑快取失效，根 layout 不觸發重渲染

#### Scenario: 標記全部已讀後只刷新通知頁面
- **WHEN** 使用者呼叫 `markAllNotificationsRead`
- **THEN** 只有 `/notifications` 路徑快取失效，根 layout 不觸發重渲染
