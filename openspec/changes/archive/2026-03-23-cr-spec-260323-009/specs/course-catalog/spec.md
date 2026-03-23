## ADDED Requirements

### Requirement: 課程目錄定義
系統 SHALL 以 config-driven 方式定義啟動靈人課程目錄，包含：啟動靈人 1、啟動靈人 2、啟動靈人 3、啟動靈人 4，每門課程含 courseLevel（enum）、label（顯示名稱）、isActive（是否開放）、prerequisiteLevel（先修等級，null 表示無先修）。

#### Scenario: 課程目錄包含四門課程
- **WHEN** 系統讀取課程目錄設定
- **THEN** 返回四門課程：啟動靈人 1（level1）、啟動靈人 2（level2）、啟動靈人 3（level3）、啟動靈人 4（level4）

#### Scenario: 啟動靈人 1 和 2 為開放狀態
- **WHEN** 系統讀取課程目錄
- **THEN** level1 和 level2 的 isActive 為 true；level3 和 level4 的 isActive 為 false

#### Scenario: 啟動靈人 2 有先修條件
- **WHEN** 系統讀取 level2 的課程設定
- **THEN** prerequisiteLevel 為 1（需完成 啟動靈人 1）

#### Scenario: 啟動靈人 1 無先修條件
- **WHEN** 系統讀取 level1 的課程設定
- **THEN** prerequisiteLevel 為 null

### Requirement: CourseInvite 綁定課程等級
每個 CourseInvite 記錄 SHALL 包含一個 `courseLevel` 欄位（CourseLevel enum），標示該邀請屬於哪門課程。

#### Scenario: 建立邀請時指定課程等級
- **WHEN** 教師建立邀請並選擇 level1 或 level2
- **THEN** CourseInvite 記錄的 courseLevel 欄位儲存對應的 enum 值

#### Scenario: 現有邀請資料向後相容
- **WHEN** 資料庫執行 migration
- **THEN** 現有 CourseInvite 記錄的 courseLevel 預設為 level1

### Requirement: 建立邀請課程選擇只顯示開放課程
建立邀請表單 SHALL 只列出 isActive 為 true 的課程供教師選擇。

#### Scenario: 表單不顯示未開放課程
- **WHEN** 教師開啟建立邀請 Dialog
- **THEN** 課程選單只包含 啟動靈人 1 和 啟動靈人 2，不包含 啟動靈人 3 和 4
