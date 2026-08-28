## 1. Config：動作觸發說明

- [x] 1.1 `config/admin-log-action.ts`：`ADMIN_LOG_ACTIONS` 每個動作項新增 `trigger: string`（文案見 design.md 決策 2 的表格）
- [x] 1.2 確認既有 `getAdminLogActionLabel`、`ADMIN_LOG_ACTION_VALUES`、`AdminLogAction` 型別與 `course-operation-log.tsx` 的引用不受影響（純新增欄位）

## 2. Data Layer：查詢函式

- [x] 2.1 `lib/data/admin-logs.ts`：新增 `getAdminActivityLogs(params: { page?: number; action?: string; keyword?: string; dateFrom?: string; dateTo?: string }): Promise<AdminLogList>`
  - `action`：值屬 `ADMIN_LOG_ACTION_VALUES` 時 `where.action = action`，否則不過濾
  - `keyword`：trim 後非空時，`where.OR` 對 `actorName`／`targetName`／`inviteTitle`／`detail` 做 `{ contains, mode: 'insensitive' }`
  - `dateFrom`／`dateTo`：解析 `YYYY-MM-DD`，分別 `createdAt >= 當日 00:00:00.000`、`createdAt <= 當日 23:59:59.999`；解析失敗則忽略該邊界
  - 排序 `createdAt: 'desc'`，`skip/take` 用既有 `PAGE_SIZE`，`select` 僅快照欄，回傳 `{ items, total, page, totalPages }`
- [x] 2.2 `getAdminLogs({ inviteId, page })` 維持不動，確認課程頁 `CourseOperationLog` 行為不變

## 3. 清單頁

- [x] 3.1 新增 `app/[locale]/(admin)/admin/activity-logs/page.tsx`（server component，`export const dynamic = 'force-dynamic'`）
  - 讀 `searchParams`：`action` / `q` / `from` / `to` / `page`
  - 呼叫 `getAdminActivityLogs`，逐筆卡片顯示：動作 Badge（`getAdminLogActionLabel`）、時間、操作者、對象（含 email）、班級（`inviteTitle` 有值才顯示）、摘要（`detail` 有值才顯示）
  - 空狀態：無資料／篩選無結果各自提示
  - 標題列右側「說明」按鈕 `Link` 至 `/admin/activity-logs/rules`
  - 分頁：沿用 `admin/support-inquiries/page.tsx` 的 `getPaginationRange` 與 `Pagination` 元件，querystring 帶回 `action`/`q`/`from`/`to`
- [x] 3.2 新增 `app/[locale]/(admin)/admin/activity-logs/activity-logs-filter.tsx`（client component，比照 `course-sessions-filter.tsx`）
  - 動作類型下拉（「全部」＋ `ADMIN_LOG_ACTION_VALUES` 各 label）
  - 關鍵字文字框
  - 起／訖日期 `<input type="date">`
  - 送出以 `useRouter().push` 帶 querystring；任一條件變更時 `page` 重設為 1
  - 「清除篩選」連回 `/admin/activity-logs`
- [x] 3.3 頁面字串一律繁體硬編碼（不進 `messages/*.json`），比照 `admin/page.tsx`

## 4. 規則說明頁

- [x] 4.1 新增 `app/[locale]/(admin)/admin/activity-logs/rules/page.tsx`（server component）
  - `Object.entries(ADMIN_LOG_ACTIONS)` 逐項渲染：動作代碼、`label`、`trigger`
  - 固定段落說明通則：文字快照保存、對象刪除後仍可讀、每頁 30 筆最新在前、交易失敗回滾不留紀錄
  - 返回「系統活動紀錄」的 `Link`（`/admin/activity-logs`）
- [x] 4.2 確認新增 config 動作時此頁自動反映（不寫死動作清單）

## 5. 後台首頁入口

- [x] 5.1 `app/[locale]/(admin)/admin/page.tsx`：`ADMIN_FEATURES` 新增一項
  - `title: '系統活動紀錄'`、`description: '檢視後台管理操作紀錄'`、`href: '/admin/activity-logs'`、`superadminOnly: false`
  - `icon`：引入一個合適的 Tabler icon（如 `IconHistory`）

## 6. 文件與版本（CLAUDE.md #7、#9）

- [x] 6.1 `doc/管理者操作手冊.md`：於「十八、提問管理」之後、「附錄：權限速查」之前新增「## 十九、系統活動紀錄」，說明：清單頁位置與欄位、三種篩選（動作類型／關鍵字／日期區間）、分頁、「說明」按鈕與規則頁、記錄規則摘要（5 種動作）
- [x] 6.2 `doc/管理者操作手冊.md`：更新「## 目錄」新增第 19 項與錨點；檔首版本標註與日期改為套用當日
- [x] 6.3 `doc/老師手冊.md`、`doc/學員手冊.md` 不涉及後台活動紀錄，確認不需更動
- [x] 6.4 `config/version.json`：patch 版號 +1，`updatedAt` 更新為套用當日（YYYY-MM-DD）

## 7. 驗證

- [x] 7.1 `npm run lint`（無新增 error）
- [x] 7.2 `npm run build`（編譯成功、TypeScript 檢查通過）
- [x] 7.3 程式層驗證：`/[locale]/admin/activity-logs` route `npm run build` 註冊成功；`getAdminActivityLogs` 依 spec 處理 action／keyword／date 三種條件與分頁、「清除篩選」連回無 querystring、空狀態雙分支。未以瀏覽器登入 admin 實際點擊（無瀏覽器自動化工具）
- [x] 7.4 程式層驗證：`/[locale]/admin/activity-logs/rules` route build 註冊成功；頁面 `Object.entries(ADMIN_LOG_ACTIONS)` 渲染 5 動作＋`trigger`、通則段落、返回連結皆到位
- [x] 7.5 `ADMIN_FEATURES` 新增「系統活動紀錄」卡（`IconHistory`、`superadminOnly: false`）；兩新路由位於 `(admin)/` group，守衛由 `(admin)/layout.tsx` 的 `canAccessAdmin` 統一把關、頁面未重複判定。未以非 admin 身分實際瀏覽器驗證轉導
- [x] 7.6 `git status prisma/` 為空——未新增 migration、未改動 `AdminActionLog` schema
