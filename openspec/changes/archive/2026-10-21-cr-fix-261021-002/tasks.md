## 1. 修正

- [x] 1.1 `app/api/admin/dashboard/generations/export/route.ts`：`formatDateTime()` 改以 `Intl.DateTimeFormat` 搭配 `timeZone: 'Asia/Taipei'` 組出「YYYY-MM-DD HH:mm:ss」字串，取代目前 `toISOString()` 的 UTC 輸出。（實作時發現 `hour12: false` 在部分環境會印出「24」而非「00」，改用 `hourCycle: 'h23'` 修正）

## 2. 版本號

- [x] 2.1 `config/version.json` patch +1，`updatedAt` 更新為當日日期。

## 3. 驗證

- [x] 3.1 `npx tsc --noEmit` 與 `npm run build` 皆成功。
- [x] 3.2 情境：下載一份含跨月邊界附近結業紀錄的月份，確認顯示時間為台北時間而非 UTC（與資料庫原始 `graduatedAt` 的台北時間換算一致）。（以 node 腳本實測 UTC 2026-10-31T16:30 → 正確輸出「2026-11-01 00:30:00」，另測跨年、跨日邊界皆正確）
