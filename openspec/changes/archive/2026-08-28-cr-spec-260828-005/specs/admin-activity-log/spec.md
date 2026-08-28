## ADDED Requirements

### Requirement: 後台系統活動紀錄清單頁

後台 SHALL 提供「系統活動紀錄」頁面（`/admin/activity-logs`），逐筆呈現 `AdminActionLog` 全系統管理操作紀錄，**最新在前**、每頁 30 筆。頁面存取權 SHALL 由 `(admin)` 群組守衛（`canAccessAdmin`）把關，頁面本身 SHALL NOT 重複判定 session／權限。每筆紀錄 SHALL 以**文字快照欄**呈現，不 join 會員或班級：動作標籤（依 `config/admin-log-action.ts`，未知代碼原樣顯示）、發生時間、操作者姓名（`actorName`）、對象姓名（`targetName`，含 email）、班級（`inviteTitle`，為空時不顯示該欄）、摘要（`detail`，為空時不顯示該欄）。分頁器行為 SHALL 比照後台提問管理頁。

#### Scenario: 檢視活動紀錄清單
- **WHEN** 管理者開啟 `/admin/activity-logs`
- **THEN** 頁面列出 `AdminActionLog` 紀錄，依 `createdAt` 由新到舊排序，每頁最多 30 筆，並顯示總筆數與頁碼

#### Scenario: 翻頁
- **WHEN** 管理者點擊分頁器切換至第 N 頁
- **THEN** 頁面顯示第 N 頁的 30 筆紀錄，排序與篩選條件維持不變

#### Scenario: 對象或班級已被刪除仍可讀
- **WHEN** 某紀錄的對象會員或班級之後被刪除（外鍵為 null）
- **THEN** 該筆仍完整顯示，內容取自建立當下寫入的文字快照欄

#### Scenario: 尚無任何紀錄
- **WHEN** `AdminActionLog` 無任何資料
- **THEN** 頁面顯示空狀態提示，不顯示分頁器

#### Scenario: 非管理者不可存取
- **WHEN** 未具 `admin`／`superadmin` 身分者嘗試開啟 `/admin/activity-logs`
- **THEN** 由 `(admin)` 群組守衛轉導離開，無法看到頁面內容

### Requirement: 活動紀錄篩選與查詢

清單頁 SHALL 提供三種可組合的篩選條件，並以 querystring（`action` / `q` / `from` / `to` / `page`）保存：

- **動作類型**：下拉選單，選項為「全部」加上 `ADMIN_LOG_ACTION_VALUES` 各動作標籤；選定某動作時僅顯示該 `action` 的紀錄，「全部」或未指定時不以動作過濾。
- **關鍵字**：對 `actorName`、`targetName`、`inviteTitle`、`detail` 四個快照欄做不分大小寫的部分比對，任一欄命中即納入。
- **日期區間**：起日與訖日（`YYYY-MM-DD`），套用於 `createdAt`；訖日 SHALL 涵蓋當日整日（比對至當日 23:59:59.999）。

變更任一篩選條件時頁碼 SHALL 重設為第 1 頁。頁面 SHALL 提供「清除篩選」回到未篩選狀態。

#### Scenario: 依動作類型篩選
- **WHEN** 管理者將動作類型下拉選為「移除學員」
- **THEN** 清單僅顯示 `action = enrollment_remove` 的紀錄，頁碼重設為 1

#### Scenario: 關鍵字比對快照欄
- **WHEN** 管理者在關鍵字欄輸入某位學員姓名並送出
- **THEN** 清單顯示 `actorName`／`targetName`／`inviteTitle`／`detail` 任一欄包含該關鍵字（不分大小寫）的紀錄

#### Scenario: 日期區間含訖日當天
- **WHEN** 管理者設定起日與訖日為同一天，該日有數筆紀錄
- **THEN** 清單顯示該日 00:00 至 23:59:59 之間的所有紀錄，不因時間在當日稍晚而被排除

#### Scenario: 條件可組合
- **WHEN** 管理者同時設定動作類型、關鍵字與日期區間
- **THEN** 清單只顯示同時滿足三項條件的紀錄

#### Scenario: 翻頁保留篩選
- **WHEN** 管理者在已套用篩選的情況下翻頁
- **THEN** 新頁沿用相同的 `action`／`q`／`from`／`to` 條件

#### Scenario: 篩選無結果
- **WHEN** 目前篩選條件下沒有任何紀錄
- **THEN** 頁面顯示「查無符合條件的紀錄」之類的空狀態提示

#### Scenario: 清除篩選
- **WHEN** 管理者點擊「清除篩選」
- **THEN** 頁面回到 `/admin/activity-logs`（無 querystring），顯示全部紀錄第 1 頁

### Requirement: 活動紀錄規則說明頁

後台 SHALL 提供「活動紀錄規則說明」頁面（`/admin/activity-logs/rules`），由 `(admin)` 群組守衛把關。清單頁標題列 SHALL 有「說明」按鈕連往此頁；此頁 SHALL 有返回清單頁的連結。頁面內容 SHALL **自動**依 `config/admin-log-action.ts` 逐項列出每種被記錄的動作：動作代碼、顯示名稱、以及觸發條件說明（`trigger`，含由誰操作）。日後於 config 新增動作，此頁 SHALL 自動反映、無需另行維護。頁面另 SHALL 以固定段落說明通則：紀錄以文字快照保存、對象會員或班級日後被刪除時紀錄仍保留且可讀、清單每頁 30 筆最新在前、操作於交易中失敗回滾時不產生紀錄。

#### Scenario: 從清單頁進入說明頁
- **WHEN** 管理者於 `/admin/activity-logs` 點擊「說明」按鈕
- **THEN** 導向 `/admin/activity-logs/rules`，顯示記錄規則說明

#### Scenario: 動作清單由 config 自動帶出
- **WHEN** 管理者開啟規則說明頁
- **THEN** 頁面列出 `config/admin-log-action.ts` 中所有動作（目前為 `enrollment_add`／`enrollment_remove`／`material_finalize`／`material_reopen`／`member_delete`），每項含顯示名稱與觸發條件說明

#### Scenario: 新增動作自動同步
- **WHEN** 開發者於 `config/admin-log-action.ts` 新增一個動作項（含 `label` 與 `trigger`）
- **THEN** 規則說明頁自動多出該動作的說明，無需修改頁面程式

#### Scenario: 返回清單
- **WHEN** 管理者於規則說明頁點擊返回連結
- **THEN** 導向 `/admin/activity-logs`

#### Scenario: 非管理者不可存取
- **WHEN** 未具 `admin`／`superadmin` 身分者嘗試開啟 `/admin/activity-logs/rules`
- **THEN** 由 `(admin)` 群組守衛轉導離開

### Requirement: 後台首頁活動紀錄入口

後台首頁（`/admin`）功能卡清單 SHALL 新增一張「系統活動紀錄」卡片，連往 `/admin/activity-logs`，對所有具 `canAccessAdmin` 者可見（非 superadmin 專屬）。

#### Scenario: 管理者於後台首頁看到入口
- **WHEN** `admin` 或 `superadmin` 開啟 `/admin`
- **THEN** 功能卡清單中出現「系統活動紀錄」卡片，點擊導向 `/admin/activity-logs`

### Requirement: 活動紀錄查詢資料函式

系統 SHALL 於資料層提供查詢函式（`getAdminActivityLogs`），接受選填的 `page`、`action`、`keyword`、`dateFrom`、`dateTo` 參數，回傳 `{ items, total, page, totalPages }`，其中 `items` 僅含快照欄位（`id`／`action`／`actorName`／`targetName`／`inviteTitle`／`detail`／`createdAt`），排序為 `createdAt` 由新到舊，每頁 30 筆。既有課程頁專用的 `getAdminLogs({ inviteId, page })` SHALL 維持不變。

#### Scenario: 無參數查詢
- **WHEN** 以空參數呼叫 `getAdminActivityLogs`
- **THEN** 回傳第 1 頁、最新 30 筆全系統紀錄與總筆數

#### Scenario: 帶篩選參數查詢
- **WHEN** 帶 `action`／`keyword`／`dateFrom`／`dateTo` 呼叫
- **THEN** 僅回傳同時滿足所有已提供條件的紀錄，分頁資訊依篩選後的總數計算

#### Scenario: 無效參數被忽略
- **WHEN** `action` 為不存在的代碼、或 `dateFrom`／`dateTo` 非合法日期字串
- **THEN** 該條件被忽略（不套用該過濾），不拋錯
