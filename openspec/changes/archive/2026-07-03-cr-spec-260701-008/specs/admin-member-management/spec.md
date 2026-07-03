# admin-member-management Delta（cr-spec-260701-008）

## MODIFIED Requirements

### Requirement: 會員清單搜尋
管理者 SHALL 能在 `/admin/members` 頁面透過搜尋列篩選會員，搜尋條件涵蓋 `realName`、`name`、`nickname`、`email`、`spiritId` 欄位（OR 邏輯、不分大小寫、部分匹配）。搜尋條件 SHALL 透過 URL query string `?q=` 傳遞，以支援書籤與重新整理保留。表格欄位順序 SHALL 為：啟動編號、姓名、Email、身分、操作（不再顯示「加入日期」欄位）。「身分」欄 SHALL 顯示該會員擁有的所有身分。Email 欄 SHALL 依機敏欄位遮蔽規則預設以 `***` 呈現、點擊逐筆切換檢視（見 admin-sensitive-masking），以 Email 為條件之搜尋比對 SHALL 不受遮蔽影響。

#### Scenario: 依姓名搜尋
- **WHEN** 管理者在搜尋列輸入名字後停頓（debounce）
- **THEN** 頁面更新 URL `?q=<輸入值>` 並僅顯示符合的會員

#### Scenario: 搜尋無結果
- **WHEN** 搜尋條件無任何符合的會員
- **THEN** 頁面顯示「查無符合的會員」提示文字，清單為空

#### Scenario: 清除搜尋
- **WHEN** 管理者清空搜尋列
- **THEN** 頁面顯示全部會員清單

#### Scenario: 依啟動編號搜尋
- **WHEN** 管理者在搜尋框輸入完整或部分啟動編號（如「PA26」）
- **THEN** 系統回傳 `spiritId` 包含該字串的所有會員（不分大小寫）

#### Scenario: 啟動編號與姓名同時匹配
- **WHEN** 管理者輸入可能匹配姓名或啟動編號的字串
- **THEN** 系統回傳 `realName`、`email`、`spiritId` 任一匹配的會員

#### Scenario: 表格欄位順序
- **WHEN** 管理者進入 `/admin/members`
- **THEN** 表格第一欄為「啟動編號」（`spiritId`），依序為姓名、Email、身分、操作；不顯示「加入日期」欄位

#### Scenario: 身分欄顯示所有身分
- **WHEN** 某會員同時具備講師與管理者身分
- **THEN** 該列「身分」欄同時顯示「講師」與「管理者」（以 badge 呈現）

#### Scenario: Email 欄預設遮蔽
- **WHEN** 管理者進入 `/admin/members`
- **THEN** 每列 Email 欄顯示 `***`，點擊該欄後僅該列切換為明文

#### Scenario: 遮蔽不影響 Email 搜尋
- **WHEN** 管理者以部分 Email 字串搜尋
- **THEN** 系統照常回傳 `email` 匹配的會員，結果列之 Email 欄仍預設遮蔽

### Requirement: 會員詳情頁
系統 SHALL 提供 `/admin/members/[id]` 頁面，以四個分頁呈現：**基本資料**、**學習階層**、**講師身分**、**特殊設定**。非管理者存取 SHALL 被重新導向至 `/`。基本資料分頁 SHALL 顯示「電話」（`phone`）欄位；Email 與電話 SHALL 依機敏欄位遮蔽規則預設以 `***` 呈現、點擊切換檢視（見 admin-sensitive-masking）。

#### Scenario: 顯示基本資料分頁
- **WHEN** 管理者進入 `/admin/members/[id]`
- **THEN** 基本資料分頁顯示：姓名（`realName`）、暱稱（`nickname`）、Email（預設遮蔽）、電話（`phone`，預設遮蔽）、靈人編號（`spiritId`）、身分（所有 `roles`）、加入日期（`createdAt`）、學習紀錄（作為學員、`startedAt IS NOT NULL` 的課程）

#### Scenario: 四個分頁可切換
- **WHEN** 管理者於詳情頁切換分頁
- **THEN** 可在基本資料／學習階層／講師身分／特殊設定間切換，各自顯示對應內容

#### Scenario: 找不到會員
- **WHEN** URL 中的 id 不存在
- **THEN** 頁面顯示 404 或重新導向至 `/admin/members`

#### Scenario: 詳情頁機敏欄位點擊檢視
- **WHEN** 管理者於基本資料分頁點擊遮蔽中的 Email 或電話
- **THEN** 該欄位切換為明文，另一欄位維持原狀態（獨立切換）

#### Scenario: 電話未填顯示破折號
- **WHEN** 會員的 `phone` 為空
- **THEN** 電話欄位顯示 `—`，無遮蔽互動
