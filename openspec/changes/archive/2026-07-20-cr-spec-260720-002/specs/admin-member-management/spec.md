# admin-member-management Delta（cr-spec-260720-002）

## MODIFIED Requirements

### Requirement: 會員詳情頁
系統 SHALL 提供 `/admin/members/[id]` 頁面，以四個分頁呈現：**基本資料**、**學習階層**、**講師身分**、**特殊設定**。非管理者存取 SHALL 被重新導向至 `/`。基本資料分頁 SHALL 顯示「電話」（`phone`）欄位；Email 與電話 SHALL 依機敏欄位遮蔽規則預設以 `***` 呈現、點擊切換檢視（見 admin-sensitive-masking）。
基本資料分頁 SHALL 顯示「年齡」欄位：依 `User.birthYear` 以「當年西元年 − birthYear」計算並以 `NN 歲` 格式顯示；`birthYear` 未填時顯示 `—`。
基本資料分頁的**學習紀錄**（作為學員之**已核准報名**課程，**含招生中**、進行中、已結業、已取消）與**授課紀錄**（自己建立之**所有**課程，**含招生中**與已取消）SHALL 以共用課程卡片元件 `CourseSessionCard` 之卡片牆呈現（手機單欄、桌機兩欄 grid），每張卡片顯示課程編號、課程標籤、課程狀態、報名人數／預計人數等標準卡片資訊，並 SHALL 連結至對應課程頁 `/course/{inviteId}`；排序 SHALL 為**招生中（未開課）在前**，其後依開課時間新→舊。學員**待審核（pending）**的報名 SHALL NOT 列入學習紀錄。無紀錄時 SHALL 分別顯示「尚無學習紀錄」／「尚無授課紀錄」。

#### Scenario: 顯示基本資料分頁
- **WHEN** 管理者進入 `/admin/members/[id]`
- **THEN** 基本資料分頁顯示：姓名（`realName`）、暱稱（`nickname`）、年齡（依 `birthYear` 計算）、Email（預設遮蔽）、電話（`phone`，預設遮蔽）、靈人編號（`spiritId`）、身分（所有 `roles`）、加入日期（`createdAt`）、學習紀錄（已核准報名之課程，含招生中）

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
