## Why

`app/api/admin/dashboard/generations/export/route.ts`（CR-FEAT-261021-002 新增）的 `formatDateTime()` 以 `date.toISOString()` 輸出「最早帶出一人結業時間」，印出的是 UTC 時間；但本功能所屬的月報（`lib/data/monthly-report.ts`）全線皆以 `Asia/Taipei`（+08:00）為月份邊界基準（`taipeiMonthBounds`／`taipeiYearMonth`）。靠近月份邊界時會誤判——例如台北時間 11/1 00:30 結業的紀錄（UTC 為 10/31 16:30），下載檔案會顯示「10/31 16:30」，看起來像屬於 10 月。這份下載正是設計來讓管理者核對月份邊界算得對不對，此 bug 會讓核對結果本身失真。

## What Changes

- `formatDateTime()` 改以 `Asia/Taipei` 時區格式化（用 `Intl.DateTimeFormat` 搭配 `timeZone: 'Asia/Taipei'`，比照 `monthly-report.ts` 既有 `taipeiYearMonth()` 寫法），輸出格式維持「YYYY-MM-DD HH:mm:ss」但時刻改為台北時間。

## Capabilities

### Added Capabilities

（無，修正既有 `admin-dashboard-monthly-report` 能力下「世代倍增原始資料下載」的時間顯示邏輯）

## Impact

- **修改** `app/api/admin/dashboard/generations/export/route.ts`：僅修改 `formatDateTime()` 的實作，不影響其他邏輯、不影響既有函式簽章。
- **不需要**資料庫 schema 變更、不影響操作手冊既有文字（手冊未描述具體時間格式細節）、不影響版本號以外的檔案。
- **版本號**：`config/version.json` patch +1。
