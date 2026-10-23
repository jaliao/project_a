## MODIFIED Requirements

### Requirement: 會員清單搜尋
管理者 SHALL 能在 `/admin/members` 頁面透過搜尋列篩選會員，搜尋條件涵蓋 `realName`、`name`、`nickname`、`email`、`spiritId` 欄位（OR 邏輯、不分大小寫、部分匹配）。搜尋條件 SHALL 透過 URL query string `?q=` 傳遞，以支援書籤與重新整理保留。表格欄位順序 SHALL 為：啟動編號、姓名、Email、身分、操作（不再顯示「加入日期」欄位）。「身分」欄 SHALL 透過共用邏輯 `getIdentityTags()` 計算並顯示該會員擁有的所有身分標籤，包含角色身分（講師／管理者／一般會員）與是否為未註冊代填學員（`isProxyMember`）；姓名欄 SHALL NOT 再額外顯示獨立的未註冊徽章。Email 欄 SHALL 依機敏欄位遮蔽規則預設以 `***` 呈現、點擊逐筆切換檢視（見 admin-sensitive-masking），以 Email 為條件之搜尋比對 SHALL 不受遮蔽影響。

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

#### Scenario: 身分欄納入未註冊學員狀態
- **WHEN** 某會員 `isProxyMember` 為 `true`
- **THEN** 該列「身分」欄包含「未註冊學員」標籤（與其他身分標籤同一樣式），姓名旁不再顯示獨立徽章

#### Scenario: Email 欄預設遮蔽
- **WHEN** 管理者進入 `/admin/members`
- **THEN** 每列 Email 欄顯示 `***`，點擊該欄後僅該列切換為明文

#### Scenario: 遮蔽不影響 Email 搜尋
- **WHEN** 管理者以部分 Email 字串搜尋
- **THEN** 系統照常回傳 `email` 匹配的會員，結果列之 Email 欄仍預設遮蔽

### Requirement: 會員詳情頁
系統 SHALL 提供 `/admin/members/[id]` 頁面，以四個分頁呈現：**基本資料**、**學習階層**、**講師身分**、**特殊設定**。非管理者存取 SHALL 被重新導向至 `/`。基本資料分頁 SHALL 顯示「電話」（`phone`）欄位；Email 與電話 SHALL 依機敏欄位遮蔽規則預設以 `***` 呈現、點擊切換檢視（見 admin-sensitive-masking）。
基本資料分頁 SHALL 顯示「年齡」欄位：依 `User.birthYear` 以「當年西元年 − birthYear」計算並以 `NN 歲` 格式顯示；`birthYear` 未填時顯示 `—`。
基本資料分頁的**學習紀錄**（作為學員之**已核准報名**課程，**含招生中**、進行中、已結業、已取消）與**授課紀錄**（自己建立之**所有**課程，**含招生中**與已取消）SHALL 以共用課程卡片元件 `CourseSessionCard` 之卡片牆呈現（手機單欄、桌機兩欄 grid），每張卡片顯示課程編號、課程標籤、課程狀態、報名人數／預計人數等標準卡片資訊，並 SHALL 連結至對應課程頁 `/course/{inviteId}`；排序 SHALL 為**招生中（未開課）在前**，其後依開課時間新→舊。學員**待審核（pending）**的報名 SHALL NOT 列入學習紀錄。無紀錄時 SHALL 分別顯示「尚無學習紀錄」／「尚無授課紀錄」。
基本資料分頁「身分」欄位 SHALL 透過共用邏輯 `getIdentityTags()` 計算並顯示，包含角色身分（所有 `roles`）與是否為未註冊代填學員（`isProxyMember`）；頁首姓名旁 SHALL NOT 再額外顯示獨立的未註冊徽章。

#### Scenario: 顯示基本資料分頁
- **WHEN** 管理者進入 `/admin/members/[id]`
- **THEN** 基本資料分頁顯示：姓名（`realName`）、暱稱（`nickname`）、年齡（依 `birthYear` 計算）、Email（預設遮蔽）、電話（`phone`，預設遮蔽）、靈人編號（`spiritId`）、身分（所有 `roles`，含未註冊學員狀態）、加入日期（`createdAt`）、學習紀錄（已核准報名之課程，含招生中）

#### Scenario: 身分欄位納入未註冊學員狀態
- **WHEN** 管理者開啟一筆 `isProxyMember = true` 帳號的詳情頁
- **THEN** 基本資料分頁「身分」欄位包含「未註冊學員」標籤（與其他身分標籤同一樣式），頁首姓名旁不再顯示獨立徽章

#### Scenario: 年齡欄位顯示
- **WHEN** 會員的 `birthYear` 有值（如 1990，當年為 2026）
- **THEN** 基本資料顯示年齡 `36 歲`

#### Scenario: 年齡未填顯示破折號
- **WHEN** 會員的 `birthYear` 為 null
- **THEN** 年齡欄位顯示 `—`

#### Scenario: 招生中課程顯示於紀錄
- **WHEN** 會員為某招生中課程（`startedAt == null`）的已核准學員、或建立了招生中課程
- **THEN** 該課程以卡片顯示於學習紀錄／授課紀錄，狀態標籤為「招生中」，且排在已開課課程之前

#### Scenario: 待審核報名不列入
- **WHEN** 會員對某課程的報名 `status = 'pending'`
- **THEN** 該課程不出現在學習紀錄

#### Scenario: 學習紀錄以課程卡片呈現
- **WHEN** 管理者檢視基本資料分頁且該會員有已核准報名的課程
- **THEN** 學習紀錄區塊以 `CourseSessionCard` 卡片牆顯示各課程（含課程編號、標籤、狀態、人數），點擊卡片導向 `/course/{inviteId}`

#### Scenario: 授課紀錄以課程卡片呈現
- **WHEN** 管理者檢視基本資料分頁且該會員有建立的課程
- **THEN** 授課紀錄區塊以 `CourseSessionCard` 卡片牆顯示各課程（含課程編號、標籤、狀態、人數），點擊卡片導向 `/course/{inviteId}`

#### Scenario: 無紀錄空狀態
- **WHEN** 會員無學習紀錄或無授課紀錄
- **THEN** 對應區塊顯示「尚無學習紀錄」／「尚無授課紀錄」

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

## REMOVED Requirements

### Requirement: 代填學員標示
**Reason**: 姓名旁的獨立「未註冊」徽章被取消，相關狀態改併入「身分」欄位／欄目（見「會員清單搜尋」「會員詳情頁」需求中新增的未註冊學員標籤 Scenario），不再以獨立於身分之外的方式呈現。
**Migration**: `/admin/members` 列表與 `/admin/members/[id]` 詳情頁頁首移除姓名旁的 `UnregisteredStudentBadge`／舊版琥珀色 Badge；「未註冊學員」狀態改由「身分」欄位的 `getIdentityTags()` + `IdentityTagBadges` 呈現，文字與樣式與其他身分標籤一致（不再是專屬警示色）。
