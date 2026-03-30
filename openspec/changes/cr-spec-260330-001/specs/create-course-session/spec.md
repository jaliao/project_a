## MODIFIED Requirements

### Requirement: 合併開課表單 Dialog 入口
系統 SHALL 提供「新增開課」Dialog 入口，點擊後開啟三步驟開課精靈（`CreateCourseWizard`）。

#### Scenario: 點擊新增開課按鈕
- **WHEN** 使用者點擊首頁「新增開課」按鈕
- **THEN** 系統開啟 CreateCourseWizard 精靈（取代原 CourseSessionDialog 單一表單）

## REMOVED Requirements

### Requirement: 課程選擇限定 isActive 課程
**Reason**: 課程選擇移至精靈 Step 1，以卡片形式呈現，規格改由 `create-course-wizard` 管理。
**Migration**: 參見 `create-course-wizard` spec — Step 1 卡片式課程選擇。

### Requirement: 預計開課日期使用 DatePicker
**Reason**: 日期欄位移至精靈 Step 2，規格改由 `create-course-wizard` 管理。
**Migration**: 參見 `create-course-wizard` spec — Step 2 基本資料填寫。

### Requirement: 邀請截止日期欄位
**Reason**: 邀請截止日期移至精靈 Step 2，規格改由 `create-course-wizard` 管理。
**Migration**: 參見 `create-course-wizard` spec — Step 2 基本資料填寫。

### Requirement: 開發環境自動填入測試資料
**Reason**: 開發環境自動填入移至精靈 Step 2，規格改由 `create-course-wizard` 管理。
**Migration**: 參見 `create-course-wizard` spec — 開發環境自動填入測試資料。
