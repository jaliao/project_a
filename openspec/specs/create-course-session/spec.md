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
開課（`createCourseSession`）時的預計人數上限 SHALL 依全域設定 `class_max_capacity`（預設 7）決定，取代原本固定的 7。伺服器端 SHALL 為權威驗證：一般使用者（老師）的 `maxCount` SHALL 不超過 `class_max_capacity` 且 `maxCount ≥ 1`；管理者可放寬（受硬頂防呆）。開課精靈的人數欄位上限與提示文字 SHALL 反映目前上限值。

#### Scenario: 老師開課受上限限制
- **WHEN** 老師開課填寫 `maxCount` 超過 `class_max_capacity`
- **THEN** 伺服器拒絕並提示上限值

#### Scenario: 上限值調整後即時反映
- **WHEN** 管理者將 `class_max_capacity` 調為 10 後，老師開課
- **THEN** 人數上限提示與驗證以 10 為準

#### Scenario: 下限仍為 1
- **WHEN** `maxCount` 小於 1
- **THEN** 伺服器拒絕

### Requirement: 管理者代講師建立授課

系統 SHALL 允許管理者（`canAccessAdmin`）於「具任一書籍講師身分」之會員的個人頁（`/user/{spiritId}`）「授課」區塊，代該會員建立授課（`CourseInvite`）。建立出的課程其 `createdById` SHALL 為**該會員（該老師）**，非操作的管理者。

- 代建立入口 SHALL 僅在**檢視者為管理者、且頁主 `roles` 含 `teacher_1`／`teacher_2`／`teacher_3` 任一**時顯示（非本人頁亦顯示）；頁主不具任何書籍講師身分時 SHALL NOT 顯示入口。
- 代建立表單可選的課程（書別）SHALL 僅限**頁主已持有的書籍講師身分**對應之啟用中課程（`teacher_1`→課程目錄 1、`teacher_2`→2、`teacher_3`→3）。
- `createCourseSession` server action SHALL 接受選填參數 `targetTeacherId`。當 `targetTeacherId` 有值且不等於操作者：
  - SHALL 權威驗證操作者具 `canAccessAdmin`，否則回傳 `{ success: false, message: '無權限' }`。
  - SHALL 驗證 `targetTeacherId` 對應之會員存在，且**實際持有**該課程書別對應的書籍講師身分（`TEACHER_ROLE_BY_CATALOG[courseCatalogId]` ∈ 該會員 `roles`）；不符 SHALL 拒絕且不建立課程。此驗證 SHALL NOT 套用「管理者 override」（即不因目標會員本身為 admin 而放行其未持有的書別）。
  - 通過後 SHALL 以 `targetTeacherId` 為 `CourseInvite.createdById`，並將「授課已建立」Inbox 通知寄給 `targetTeacherId`。
- 人數上限（`class_max_capacity`）SHALL 以**操作者**身分判定放寬與否（代建立時操作者為管理者，維持可放寬至硬頂）。
- 未帶 `targetTeacherId` 時，`createCourseSession` SHALL 維持原行為（以操作者為建立者、`canTeachBook` 判定、通知寄給操作者本人）。

#### Scenario: 管理者於講師頁代建立授課

- **WHEN** 管理者開啟某具 `teacher_2` 身分之會員的 `/user/{spiritId}` 頁，於「授課」區塊選擇「啟動豐盛」課程並送出代建立
- **THEN** 系統建立 `CourseInvite`，其 `createdById` 為該會員、`courseCatalogId` 對應啟動豐盛，回傳成功，且「授課已建立」通知寄給該會員

#### Scenario: 代建立書別限於該老師持有的身分

- **WHEN** 管理者為僅具 `teacher_1` 身分的會員代建立授課
- **THEN** 課程選單僅出現「啟動靈人」；若直接以 `targetTeacherId` 呼叫 action 指定該會員未持有之書別（如啟動得勝），server 端拒絕且不建立課程

#### Scenario: 頁主非講師時無代建立入口

- **WHEN** 管理者開啟一位不具任何 `teacher_*` 身分之會員的 `/user/{spiritId}` 頁
- **THEN** 「授課」區塊不顯示，亦無「新增授課」按鈕

#### Scenario: 非管理者帶 targetTeacherId 被拒

- **WHEN** 不具 `canAccessAdmin` 的使用者呼叫 `createCourseSession` 並帶入 `targetTeacherId`
- **THEN** 回傳 `{ success: false, message: '無權限' }`，不建立課程

#### Scenario: 未帶 targetTeacherId 維持原行為

- **WHEN** 具書籍講師身分的會員於本人頁一般新增授課（未帶 `targetTeacherId`）
- **THEN** 系統以該會員為 `createdById` 建立課程，行為與本變更前一致

