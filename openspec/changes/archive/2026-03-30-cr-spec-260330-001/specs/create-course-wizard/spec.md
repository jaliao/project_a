## ADDED Requirements

### Requirement: 開課入口身分前置檢核
系統 SHALL 根據使用者身分決定授課區塊的可見性。`admin` 與 `superadmin` 及具備至少一個講師身分的 `user` 可見授課區塊；無任何講師身分的 `user` SHALL NOT 顯示授課區塊（整體隱藏）。

#### Scenario: admin 顯示授課區塊
- **WHEN** role 為 `admin` 或 `superadmin` 的使用者進入學員頁面
- **THEN** 系統顯示授課區塊，包含「新增授課」按鈕

#### Scenario: user 具備講師身分顯示授課區塊
- **WHEN** role 為 `user` 且具備至少一個 level 的結業證書的使用者進入學員頁面
- **THEN** 系統顯示授課區塊，包含「新增授課」按鈕

#### Scenario: user 不具備講師身分隱藏授課區塊
- **WHEN** role 為 `user` 且無任何結業證書的使用者進入學員頁面
- **THEN** 授課區塊完全不顯示（非 disabled，而是整體隱藏）

### Requirement: Step 1 — 卡片式課程選擇
精靈第一步 SHALL 以卡片形式展示所有 `isActive: true` 的課程。有資格開設的卡片可點擊選取；無資格的卡片以灰暗樣式顯示且不可點擊。選中狀態以視覺樣式（border/ring）區分。

#### Scenario: 顯示所有開放課程卡片
- **WHEN** 使用者進入精靈 Step 1
- **THEN** 頁面顯示「靈人啟動 1」與「靈人啟動 2」兩張課程卡片（無論是否有資格）

#### Scenario: 有資格的課程卡片可點擊
- **WHEN** 使用者具備靈人啟動 1 講師身分，點擊「靈人啟動 1」卡片
- **THEN** 卡片呈現選中樣式（border/ring），「下一步」按鈕變為可點擊

#### Scenario: 無資格的課程卡片不可點擊
- **WHEN** 使用者不具備靈人啟動 2 講師身分，點擊「靈人啟動 2」卡片
- **THEN** 卡片不響應點擊，維持灰暗不可選取狀態，顯示「須先完成啟動靈人 2 才能授課」提示文字

#### Scenario: 無資格提示文字格式
- **WHEN** 使用者不具備某課程講師身分，檢視該課程卡片
- **THEN** 卡片顯示「須先完成{課程名稱}才能授課」（課程名稱為該卡片本身，例如「須先完成啟動靈人 2 才能授課」）

#### Scenario: 未選課程不可進入下一步
- **WHEN** 使用者未點擊任何課程卡片
- **THEN** 「下一步」按鈕保持 disabled

#### Scenario: admin 可點擊所有課程卡片
- **WHEN** role 為 `admin` 或 `superadmin` 的使用者進入 Step 1
- **THEN** 所有開放課程卡片均可點擊，無資格限制

### Requirement: Step 2 — 基本資料填寫
精靈第二步 SHALL 提供開課基本資料表單，欄位與現有開課表單相同：預計開課日期（DatePicker）、邀請截止日期（DatePicker）、預計人數。

#### Scenario: 顯示基本資料表單
- **WHEN** 使用者完成 Step 1 並點擊「下一步」
- **THEN** 頁面切換至 Step 2，顯示三個欄位：預計開課日期、邀請截止日期、預計人數

#### Scenario: 截止日期早於今天
- **WHEN** 使用者在邀請截止日期選擇過去的日期
- **THEN** 系統顯示欄位錯誤「截止日期不可早於今天」

#### Scenario: 必填欄位空白不可進入下一步
- **WHEN** 使用者未填寫預計開課日期或預計人數
- **THEN** 「下一步」按鈕保持 disabled

#### Scenario: 可返回 Step 1 修改課程選擇
- **WHEN** 使用者點擊「上一步」
- **THEN** 頁面切換回 Step 1，已選課程維持選中狀態

### Requirement: Step 3 — 預覽確認並完成開課
精靈第三步 SHALL 顯示開課資訊摘要（課程名稱、預計開課日期、邀請截止日期、預計人數），使用者確認後送出，系統建立 CourseOrder 與 CourseInvite。

#### Scenario: 預覽顯示完整資訊
- **WHEN** 使用者進入 Step 3
- **THEN** 頁面顯示課程名稱、預計開課日期、邀請截止日期、預計人數的唯讀摘要

#### Scenario: 成功確認開課
- **WHEN** 使用者點擊「確認開課」
- **THEN** 系統建立 CourseOrder 與 CourseInvite，顯示「開課單已建立！」toast，並切換至邀請學員階段

#### Scenario: 建立失敗
- **WHEN** server action 回傳錯誤
- **THEN** 顯示「建立失敗，請稍後再試」提示，使用者仍停留在 Step 3

#### Scenario: 可返回 Step 2 修改資料
- **WHEN** 使用者點擊「上一步」
- **THEN** 頁面切換回 Step 2，已填資料維持不變

### Requirement: 邀請學員階段 — 複製連結
開課完成後，精靈 SHALL 進入邀請階段並顯示邀請連結，提供「複製連結」按鈕。

#### Scenario: 邀請階段顯示複製連結
- **WHEN** Step 3 確認開課成功後
- **THEN** 精靈切換至邀請階段，顯示格式為 `{origin}/invite/{token}` 的邀請連結與「複製連結」按鈕

#### Scenario: 點擊複製連結
- **WHEN** 使用者點擊「複製連結」
- **THEN** 連結複製至剪貼簿，按鈕短暫顯示「已複製！」

### Requirement: 邀請學員階段 — Spirit ID 邀請
邀請階段 SHALL 提供 Spirit ID 輸入欄位，使用者填入後點擊「送出邀請」，系統發送 Inbox 通知給對應學員。

#### Scenario: 成功透過 Spirit ID 邀請
- **WHEN** 使用者輸入有效的 Spirit ID 並點擊「送出邀請」
- **THEN** 系統查找對應 User，發送 Inbox 通知給該學員，顯示「邀請通知已送出」toast，輸入欄位清空

#### Scenario: Spirit ID 不存在
- **WHEN** 使用者輸入不存在的 Spirit ID 並點擊「送出邀請」
- **THEN** 系統顯示「找不到此會員編號，請確認後重試」錯誤

#### Scenario: Spirit ID 欄位空白
- **WHEN** Spirit ID 欄位為空時點擊「送出邀請」
- **THEN** 「送出邀請」按鈕保持 disabled

#### Scenario: 邀請後可繼續邀請其他人
- **WHEN** 一次邀請成功後
- **THEN** 輸入欄清空，使用者可繼續輸入下一個 Spirit ID

### Requirement: 開發環境自動填入測試資料
在 `NODE_ENV === 'development'` 環境下，精靈 Step 2 SHALL 自動填入預定義的 DEV_DEFAULTS，可直接送出。

#### Scenario: 開發環境開啟精靈
- **WHEN** 開發環境使用者進入 Step 2
- **THEN** 預計開課日期、邀請截止日期、預計人數已預先填入測試資料

#### Scenario: 正式環境開啟精靈
- **WHEN** 正式環境使用者進入 Step 2
- **THEN** 所有欄位為空，需手動填寫
