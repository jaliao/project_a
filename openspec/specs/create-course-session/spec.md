# create-course-session Specification

## Purpose
TBD - normalized for archive compatibility. Update Purpose for create-course-session.
## Requirements
### Requirement: 合併開課表單 Dialog 入口
系統 SHALL 提供「新增開課」Dialog 入口，點擊後開啟三步驟開課精靈（`CreateCourseWizard`）。

#### Scenario: 點擊新增開課按鈕
- **WHEN** 使用者點擊首頁「新增開課」按鈕
- **THEN** 系統開啟 CreateCourseWizard 精靈（取代原 CourseSessionDialog 單一表單）

### Requirement: 開課需具講師身分
建立課程（`CourseInvite`）SHALL 僅允許具開課權限的會員執行，即身分集合含 `teacher`、`admin` 或 `superadmin`（`canTeach` 為真）。未具資格者送出開課 SHALL 被拒絕。此判定須於 Server Action 端強制執行（不僅 UI 隱藏入口）。

#### Scenario: 講師可開課
- **WHEN** 身分含 `teacher` 的會員送出開課
- **THEN** 系統建立課程，回傳成功

#### Scenario: 管理者可開課
- **WHEN** 身分含 `admin` 或 `superadmin`（即使未含 `teacher`）的會員送出開課
- **THEN** 系統建立課程，回傳成功

#### Scenario: 一般會員不可開課
- **WHEN** 身分僅含 `user` 的會員送出開課
- **THEN** 回傳 `{ success: false, message: '需具講師身分方可開課' }`，不建立課程

#### Scenario: 非具資格者不顯示開課入口
- **WHEN** 不具開課權限的會員瀏覽首頁
- **THEN** 不顯示「新增開課」按鈕（UI 層），且即使直接呼叫 Server Action 仍被拒絕

### Requirement: 開發環境表單預設值
合併開課表單（`CourseSessionForm`）SHALL 僅於開發環境（`isDev`）為欄位帶入示範用預設值（課程、課程名稱、人數上限、報名截止日 `expiredAt`、預計開課日 `courseDate`），其中 `expiredAt` SHALL 早於 `courseDate`；於非開發環境 SHALL 以空白預設值呈現。預設日期值 SHALL 在元件 render 期間保持穩定（不得於每次 render 重新計算而產生不純副作用）。

#### Scenario: 開發環境帶入示範預設值
- **WHEN** `isDev` 為 true 且存在可選課程，使用者開啟開課表單
- **THEN** 表單預設帶入示範課程、人數上限與日期，且 `expiredAt` 早於 `courseDate`

#### Scenario: 非開發環境不帶示範值
- **WHEN** `isDev` 為 false，使用者開啟開課表單
- **THEN** 表單以空白預設值呈現（課程未選、名稱與人數為空）

#### Scenario: 預設日期跨 render 穩定
- **WHEN** 元件因互動而多次 render
- **THEN** 預設日期值不隨每次 render 改變（於 render 期間視為純值）

### Requirement: 預計人數上限為 7
新增授課時，預計人數（maxCount）SHALL 為整數且 **1 ≤ maxCount ≤ 7**（每班最多 7 人）。
建立表單 SHALL 顯示「每班最多 7 人」之提醒文字。
此規則 SHALL 同時套用於合併開課表單（`CourseSessionForm` / 開課精靈）與邀請建立表單（`create-invite-form`）。

#### Scenario: 超過 7 人被拒
- **WHEN** 講師於新增授課填入預計人數 8 並送出
- **THEN** 系統拒絕並提示每班最多 7 人

#### Scenario: 合法人數可建立
- **WHEN** 講師填入預計人數 1–7 之整數並送出
- **THEN** 課程成功建立

#### Scenario: 顯示人數提醒
- **WHEN** 講師開啟新增授課表單
- **THEN** 人數欄位旁顯示「每班最多 7 人」提醒文字

