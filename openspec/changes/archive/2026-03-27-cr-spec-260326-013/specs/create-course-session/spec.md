## MODIFIED Requirements

### Requirement: 合併開課表單 Dialog 入口
系統 SHALL 提供「新增授課」Dialog（按鈕文字由「新增開課」改為「新增授課」），點擊後開啟包含開課邀請設定的簡化表單。`CourseSessionDialog` SHALL 接受 `instructorName: string` prop，用於產生課程名稱預設值。

#### Scenario: 點擊新增授課按鈕
- **WHEN** 使用者點擊「新增授課」按鈕
- **THEN** 系統開啟 CourseSessionDialog

### Requirement: 開發環境自動填入測試資料
在 `NODE_ENV === 'development'` 環境下，表單 SHALL 自動以預定義的 DEV_DEFAULTS 填入所有欄位（僅含新 schema 欄位：courseLevel、title、maxCount、expiredAt、courseDate、notes）。

#### Scenario: 開發環境開啟表單
- **WHEN** 開發環境使用者開啟 CourseSessionDialog
- **THEN** 所有欄位已預先填入測試資料，可直接點選送出

#### Scenario: 正式環境開啟表單
- **WHEN** 正式環境使用者開啟 CourseSessionDialog
- **THEN** 所有欄位為空（title 除外，依課程選擇自動產生），需手動填寫

### Requirement: 建立 CourseInvite（不建立 CourseOrder）
表單送出後，系統 SHALL 直接建立 CourseInvite（含 title、courseDate、notes），不建立 CourseOrder。

#### Scenario: 成功送出表單
- **WHEN** 使用者填寫完整資料並送出
- **THEN** 系統建立 CourseInvite 一筆，顯示「授課已建立！」toast，並關閉 Dialog

#### Scenario: 資料庫錯誤
- **WHEN** 建立過程中資料庫發生錯誤
- **THEN** 記錄不建立，顯示「建立失敗，請稍後再試」錯誤提示

## ADDED Requirements

### Requirement: CourseInvite 新增 courseDate 與 notes 欄位
`CourseInvite` 資料模型 SHALL 包含 `courseDate String?`（預計開課日期）與 `notes String?`（備註）兩個可空欄位。

#### Scenario: 新授課含開課日期
- **WHEN** 使用者建立授課並填寫預計開課日期
- **THEN** CourseInvite.courseDate 儲存格式化日期字串（YYYY/MM/DD）

#### Scenario: 新授課不含備註
- **WHEN** 使用者建立授課且未填寫備註
- **THEN** CourseInvite.notes 為 null

### Requirement: 課程名稱欄位（必填，智慧預設）
表單 SHALL 包含「課程名稱」欄位（必填），預設值為 `{instructorName} 的 {courseLabel}`（例：系統管理員的啟動靈人 1）。選擇不同課程時，若使用者尚未手動修改名稱，預設值 SHALL 自動更新。

#### Scenario: 選擇課程後自動更新名稱
- **WHEN** 使用者選擇課程且尚未手動修改名稱
- **THEN** 課程名稱欄位自動更新為 `{instructorName} 的 {courseLabel}`

#### Scenario: 手動修改後不再自動覆蓋
- **WHEN** 使用者手動修改課程名稱後再切換課程
- **THEN** 課程名稱欄位維持使用者填入的內容，不自動覆蓋

#### Scenario: 課程名稱未填提交
- **WHEN** 使用者清空課程名稱並送出表單
- **THEN** 系統顯示欄位錯誤「課程名稱為必填」

### Requirement: 備註欄位（非必填）
表單 SHALL 包含「備註」欄位（非必填 textarea），儲存於 CourseInvite.notes。

#### Scenario: 填寫備註後送出
- **WHEN** 使用者填寫備註並送出
- **THEN** CourseInvite.notes 儲存備註內容

#### Scenario: 不填備註直接送出
- **WHEN** 使用者不填寫備註直接送出
- **THEN** 表單正常送出，CourseInvite.notes 為 null

## REMOVED Requirements

### Requirement: Atomic 建立 CourseOrder 與 CourseInvite
**Reason**: 教材訂購與開課邀請解耦，新增授課不再需要建立 CourseOrder。
**Migration**: 教材訂購功能仍可透過獨立的 CourseOrderDialog 操作。
