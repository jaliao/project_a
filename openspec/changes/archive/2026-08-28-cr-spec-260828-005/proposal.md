## Why

需求單 CR-SPEC-260828-005（提出人：廖柏嘉 Justin，2026-08-28）：

> 後台管理可以檢視活動紀錄 `admin_action_log`
> - 可以查詢和檢視 `admin_action_log`，讓管理者知道目前的系統狀況
> - 有一個活動紀錄規則的說明頁面，透過說明按鈕連過去，說明目前什麼活動會被 `admin_action_log` 紀錄

目前 `AdminActionLog`（`admin_action_logs` 資料表）只在**課程詳情頁**的「課程操作 LOG」區塊以單一課程 (`inviteId`) 為範圍呈現最近 30 筆（`lib/data/admin-logs.ts` 的 `getAdminLogs` 僅支援 `inviteId` / `page`）。管理者無法在後台總覽全系統的管理操作、也無從得知「哪些操作會被記錄」。本變更在後台新增一個可查詢、可翻頁的活動紀錄清單頁，以及一頁自動列出記錄規則的說明頁。

目前會寫入 `AdminActionLog` 的 5 種動作（`config/admin-log-action.ts`）：
`enrollment_add`（新增學員）、`enrollment_remove`（移除學員）、`material_finalize`（完成教材申請）、`material_reopen`（重新開放教材申請）、`member_delete`（刪除會員）。

決策（2026-08-28 與提出人確認）：

1. **查詢/篩選**：動作類型（下拉，含全部）＋ 關鍵字（比對操作者／對象／班級／摘要文字快照）＋ 起訖日期區間，三者可組合。
2. **規則說明**：獨立頁面（非 Dialog），內容**自動**依 `config/admin-log-action.ts` 列出動作清單與各自的觸發條件。

## What Changes

### 1. 後台「系統活動紀錄」清單頁（新頁 `/admin/activity-logs`）

- 位於 `app/[locale]/(admin)/admin/activity-logs/page.tsx`，存取權由 `(admin)/layout.tsx` 既有守衛（`canAccessAdmin`）統一把關，頁面內不另寫守衛。
- 逐筆列出 `AdminActionLog`，**最新在前**、每頁 30 筆、分頁器比照 `admin/support-inquiries`。
- 每筆顯示：動作標籤 Badge（`getAdminLogActionLabel`）、時間、操作者姓名、對象姓名（含 email 快照）、班級（`inviteTitle` 快照，無則不顯示）、摘要（`detail`，無則不顯示）。一律以**文字快照欄**呈現，不 join 會員／班級。
- 篩選列：
  - **動作類型**：下拉，選項為「全部」＋ `ADMIN_LOG_ACTION_VALUES` 各 label。
  - **關鍵字**：對 `actorName` / `targetName` / `inviteTitle` / `detail` 做不分大小寫的 `contains` 比對（任一命中即入選）。
  - **日期區間**：起／訖日期（`<input type="date">`），套用於 `createdAt`；訖日含當日（比對至當日 23:59:59.999）。
  - 條件以 querystring 帶入（`action` / `q` / `from` / `to` / `page`），可組合；翻頁保留條件；提供「清除篩選」回到未篩選。
- 空狀態：無資料或篩選無結果時顯示對應提示。
- 標題列右側提供「**說明**」按鈕，連往規則說明頁。

### 2. 活動紀錄規則說明頁（新頁 `/admin/activity-logs/rules`）

- 位於 `app/[locale]/(admin)/admin/activity-logs/rules/page.tsx`，同樣由 `(admin)` 守衛把關。
- 內容**自動**依 `config/admin-log-action.ts` 逐項列出：動作代碼、顯示名稱、**觸發條件說明**（含操作者範圍）。日後於 config 新增動作，此頁自動同步、無需另行維護。
- `config/admin-log-action.ts`：每個動作項新增 `trigger`（字串，說明「什麼情況下、由誰操作會產生此紀錄」）。既有 `label` 與 `getAdminLogActionLabel` 不變（純新增欄位，向後相容）。
- 另以固定段落說明通則：紀錄採文字快照保存、對象會員／班級日後被刪除仍可完整閱讀、清單每頁 30 筆最新在前、操作在交易中失敗回滾則不留紀錄。
- 頁面提供返回「系統活動紀錄」清單的連結。

### 3. 資料查詢層擴充

- `lib/data/admin-logs.ts`：新增 `getAdminActivityLogs(params: { page?; action?; keyword?; dateFrom?; dateTo? })`，回傳 `{ items, total, page, totalPages }`（沿用現有 `AdminLogItem` 型別與 `PAGE_SIZE = 30`）。
- 既有 `getAdminLogs({ inviteId, page })`（課程頁用）**保持不變**。

### 4. 後台首頁入口

- `app/[locale]/(admin)/admin/page.tsx` 的 `ADMIN_FEATURES` 新增一張卡片「系統活動紀錄 — 檢視後台管理操作紀錄」，`href: '/admin/activity-logs'`，`superadminOnly: false`（`canAccessAdmin` 皆可見），圖示沿用 Tabler（如 `IconHistory` / `IconClipboardList`）。

### 5. 文件與版本

- `doc/管理者操作手冊.md`：新增「系統活動紀錄」章節（置於「十八、提問管理」之後、「附錄」之前，編為十九），說明清單頁欄位、三種篩選、說明頁用途與記錄規則；更新目錄與檔首版本／日期。
- `config/version.json`：apply 時 patch +1、`updatedAt` 改為當日（CLAUDE.md #7）。

## Capabilities

### New Capabilities

- `admin-activity-log`：後台檢視 `AdminActionLog` 的清單頁（欄位、篩選、分頁）、規則說明頁、後台首頁入口。

### Modified Capabilities

（無。寫入面既有規格 `admin-operation-log` 不變——本變更僅新增「檢視」面。）

## Impact

- **Affected code**
  - 新增：`app/[locale]/(admin)/admin/activity-logs/page.tsx`、`app/[locale]/(admin)/admin/activity-logs/rules/page.tsx`、`app/[locale]/(admin)/admin/activity-logs/activity-logs-filter.tsx`（篩選列 client 元件，比照 `course-sessions-filter.tsx`）
  - 修改：`lib/data/admin-logs.ts`（新增 `getAdminActivityLogs`）
  - 修改：`config/admin-log-action.ts`（每動作新增 `trigger` 欄）
  - 修改：`app/[locale]/(admin)/admin/page.tsx`（`ADMIN_FEATURES` 新增卡片）
- **Database**：無 schema 變更、無 migration（`AdminActionLog` 既有，僅新增讀取查詢）。
- **i18n**（CLAUDE.md #12）：後台專屬頁，字串維持繁體硬編碼，比照現有 `admin/page.tsx`、`admin/dashboard` 等；不新增 message key。
- **Docs**（CLAUDE.md #9）：更新 `doc/管理者操作手冊.md`（新增章節＋目錄＋版本），另兩份手冊（老師／學員）不涉及、不動。
- **Version**（CLAUDE.md #7）：apply 時 `config/version.json` patch +1、`updatedAt` 當日。
- **Dependencies**：無新增套件。
- **權限**：全程 `canAccessAdmin`（admin／superadmin），與其餘後台頁一致；不開放一般會員或講師。
