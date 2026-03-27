## Why

開發環境 Node.js 記憶體洩漏導致當機（OOM at ~4GB heap）。`createNotification` 每次呼叫都觸發全站 `revalidatePath('/', 'layout')`，使得每個課程操作（開課、取消、審核、結業、申請）都強制整個 layout 重新渲染，加速記憶體累積並拖慢所有操作的回應速度。

## What Changes

- 開發環境改用 Next.js Turbopack（`next dev --turbopack`），大幅降低 HMR 記憶體用量
- `createNotification`、`markNotificationRead`、`markAllNotificationsRead` 的 `revalidatePath` 改為精確路徑（`/notifications`）而非全站 layout
- `markNotificationRead` / `markAllNotificationsRead` 額外加入 `revalidatePath('/notifications')`（已足夠，移除根路徑觸發）
- `docker-compose.dev.yml` 提高 heap 上限至 6144 MB 作為緩衝

## Capabilities

### New Capabilities

- （無）

### Modified Capabilities

- `notification`: `revalidatePath` 改為精確路徑，降低通知操作的全站重渲染成本

## Impact

**受影響的檔案：**

| 檔案 | 修改內容 |
|------|---------|
| `package.json` | `dev` script 改為 `next dev --turbopack` |
| `docker-compose.dev.yml` | `NODE_OPTIONS` heap 上限 4096 → 6144 |
| `app/actions/notification.ts` | 三個函數的 `revalidatePath('/', 'layout')` 改為 `revalidatePath('/notifications')` |

**不修改的項目（本次範圍外）：**
- `force-dynamic` 頁面（需個別評估是否可改 ISR，風險較高）
- 直接使用 Prisma 的頁面（僅為 code style 問題，不影響效能）
