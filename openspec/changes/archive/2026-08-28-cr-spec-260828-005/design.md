# 設計說明

## 決策 1：新增 `admin-activity-log` capability，與 `admin-operation-log` 分工

- `admin-operation-log`（既有）：規範**寫入面**——哪些操作會產生 `AdminActionLog`、快照欄內容、與操作同交易。
- `admin-activity-log`（新增）：規範**檢視面**——後台清單頁、篩選、分頁、規則說明頁、首頁入口。

兩者不重疊；本變更完全不改寫入面，`admin-operation-log` 的 delta 為空。

## 決策 2：規則說明頁以 `config/admin-log-action.ts` 為單一事實來源

- 現況 `ADMIN_LOG_ACTIONS` 已是 config-driven 的動作 → label 對照。
- 每項新增 `trigger: string`（「什麼情況、由誰操作會產生此紀錄」）。規則頁 `Object.entries(ADMIN_LOG_ACTIONS)` 直接渲染，日後新增動作自動出現在說明頁。
- 純新增欄位，`getAdminLogActionLabel` 與既有引用點（`course-operation-log.tsx`）不受影響。

`trigger` 文案（初版，對齊實際寫入點）：

| action | label | trigger |
|---|---|---|
| `enrollment_add` | 新增學員 | 管理者或該課授課老師於課程詳情頁「新增學員」成功加入一位已核准學員時（可含補登結業） |
| `enrollment_remove` | 移除學員 | 管理者或該課授課老師於課程詳情頁「移除學員」成功移除一位學員時（須填寫移除原因） |
| `material_finalize` | 完成教材申請 | 講師或管理者於課程詳情頁按「已完成申請」，將該課教材申請標記為完成時 |
| `material_reopen` | 重新開放教材申請 | 講師或管理者於課程詳情頁按「重新開放申請」，解除教材申請完成標記時 |
| `member_delete` | 刪除會員 | 管理者於會員詳情頁刪除一個會員帳號時（班級相關欄位為空） |

## 決策 3：查詢函式 `getAdminActivityLogs`

新增獨立函式，不動課程頁在用的 `getAdminLogs`。

```
params: { page?: number; action?: string; keyword?: string; dateFrom?: string; dateTo?: string }
```

- **action**：非空且屬 `ADMIN_LOG_ACTION_VALUES` 時 `where.action = action`；其餘（空／`all`／未知值）視為不過濾。
- **keyword**：trim 後非空時，`where.OR = [actorName, targetName, inviteTitle, detail].map(f => ({ [f]: { contains: keyword, mode: 'insensitive' } }))`。
- **dateFrom / dateFrom**：`YYYY-MM-DD` 字串；`dateFrom` → `gte` 當日 00:00、`dateTo` → `lte` 當日 23:59:59.999（避免漏掉當天）。解析失敗則忽略該邊界。
- 排序 `createdAt desc`，`skip/take` 依 `PAGE_SIZE = 30`，回 `{ items, total, page, totalPages }`。
- select 僅取快照欄（`id/action/actorName/targetName/inviteTitle/detail/createdAt`），與 `AdminLogItem` 一致，不 join。

## 決策 4：篩選 UI 與 URL 狀態

- 篩選列為 client 元件 `activity-logs-filter.tsx`（比照 `course-sessions-filter.tsx`）：動作下拉、關鍵字輸入、起訖日期，送出後以 `router.push` 帶 querystring；page 於改變篩選時重設為 1。
- page component 為 server component，讀 `searchParams`（`action` / `q` / `from` / `to` / `page`），呼叫 `getAdminActivityLogs`，分頁連結沿用 `admin/support-inquiries` 的 `getPaginationRange` 與 `Pagination` 元件，並在 querystring 中保留篩選參數。
- 「清除篩選」= 連回 `/admin/activity-logs`。

## 決策 5：權限與 i18n

- 存取控制完全交給 `(admin)/layout.tsx`（`canAccessAdmin`）；兩個新頁不重複判定（比照 CLAUDE.md #11 後台頁規範）。
- 後台專屬頁，字串繁體硬編碼，比照 `admin/page.tsx`、`admin/dashboard`；不進 `messages/*.json`（CLAUDE.md #12「後台與其專屬字串本階段維持繁體」）。

## 非目標

- 不改變任何 `AdminActionLog` 的**寫入**行為、不新增被記錄的動作類型。
- 不提供匯出（CSV/Excel）、不做即時推播或圖表統計。
- 不在會員詳情頁 / 課程頁新增「以該對象為範圍」的活動紀錄入口（課程頁已有「課程操作 LOG」）。
- 不調整 `AdminActionLog` schema、不建 migration。
