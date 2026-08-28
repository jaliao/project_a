# create-course-session Delta（cr-spec-260828-002）

## ADDED Requirements

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
