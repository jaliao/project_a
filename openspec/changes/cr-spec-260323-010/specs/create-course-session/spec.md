## ADDED Requirements

### Requirement: 合併開課表單 Dialog 入口
系統 SHALL 提供「新增開課」Dialog，點擊後開啟包含課程訂購與開課邀請資料的合併表單。

#### Scenario: 點擊新增開課按鈕
- **WHEN** 使用者點擊首頁「新增開課」按鈕
- **THEN** 系統開啟 CourseSessionDialog

### Requirement: 課程選擇限定 isActive 課程
表單 SHALL 提供課程選擇欄位，選項僅限 `COURSE_CATALOG` 中 `isActive: true` 的課程（啟動靈人 1、啟動靈人 2）。

#### Scenario: 課程選項顯示
- **WHEN** 使用者開啟表單
- **THEN** 課程 Select 僅顯示啟動靈人 1 與啟動靈人 2 兩個選項

#### Scenario: 未選課程提交
- **WHEN** 使用者未選擇課程即送出
- **THEN** 系統顯示欄位錯誤「請選擇課程」

### Requirement: 預計開課日期使用 DatePicker
預計開課日期欄位 SHALL 使用 Calendar + Popover 的 DatePicker 元件，不使用文字輸入。

#### Scenario: 選擇開課日期
- **WHEN** 使用者點擊開課日期欄位
- **THEN** 系統顯示日曆元件供選擇日期

#### Scenario: 未選開課日期提交
- **WHEN** 使用者未選擇開課日期即送出
- **THEN** 系統顯示欄位錯誤「請選擇預計開課日期」

### Requirement: 邀請截止日期欄位
表單 SHALL 包含「邀請截止日期」欄位，使用 DatePicker 元件，儲存於 CourseInvite.expiredAt。

#### Scenario: 選擇邀請截止日期
- **WHEN** 使用者點擊邀請截止日期欄位
- **THEN** 系統顯示日曆元件供選擇截止日期

#### Scenario: 截止日期早於今天
- **WHEN** 使用者選擇過去的日期作為截止日期
- **THEN** 系統顯示欄位錯誤「截止日期不可早於今天」

### Requirement: 開發環境自動填入測試資料
在 `NODE_ENV === 'development'` 環境下，表單 SHALL 自動以預定義的 DEV_DEFAULTS 填入所有欄位。

#### Scenario: 開發環境開啟表單
- **WHEN** 開發環境使用者開啟 CourseSessionDialog
- **THEN** 所有欄位已預先填入測試資料，可直接點選送出

#### Scenario: 正式環境開啟表單
- **WHEN** 正式環境使用者開啟 CourseSessionDialog
- **THEN** 所有欄位為空，需手動填寫

### Requirement: Atomic 建立 CourseOrder 與 CourseInvite
表單送出後，系統 SHALL 以單一 transaction 同時建立 CourseOrder 與 CourseInvite，任一失敗均全部 rollback。

#### Scenario: 成功送出表單
- **WHEN** 使用者填寫完整資料並送出
- **THEN** 系統建立 CourseOrder 與 CourseInvite 各一筆，顯示「開課單已建立！」toast，並關閉 Dialog

#### Scenario: 資料庫錯誤
- **WHEN** 建立過程中資料庫發生錯誤
- **THEN** 兩筆記錄均不建立，顯示「建立失敗，請稍後再試」錯誤提示
