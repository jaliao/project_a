# create-course-wizard Specification

## Purpose
TBD - normalized for archive compatibility. Update Purpose for create-course-wizard.

## Requirements

### Requirement: Step 1 — 卡片式課程選擇
精靈第一步 SHALL 以卡片形式展示所有 `isActive: true` 的課程。有資格開設的卡片可點擊選取；無資格的卡片以灰暗樣式顯示且不可點擊。選中狀態以視覺樣式（border/ring）區分。

**授課資格定義**：使用者須持有該課程對應的書籍講師身分（依 member-roles 的「講師身分與書籍對應」，即 `canTeachBook(course.id)` 為真），才具備授課資格。`admin` / `superadmin` 不受此限制，可開設所有課程。

#### Scenario: 顯示所有開放課程卡片
- **WHEN** 使用者進入精靈 Step 1
- **THEN** 頁面顯示所有 `isActive: true` 的課程卡片（無論是否有資格）

#### Scenario: 持有對應書籍講師身分的課程卡片可點擊
- **WHEN** 使用者持有 `teacher_1`（啟動靈人講師），點擊「啟動靈人」卡片
- **THEN** 卡片呈現選中樣式（border/ring），「下一步」按鈕變為可點擊

#### Scenario: 持有啟動豐盛講師身分才能開啟動豐盛
- **WHEN** 使用者持有 `teacher_2`（啟動豐盛講師），點擊「啟動豐盛」卡片
- **THEN** 卡片呈現選中樣式，「下一步」按鈕變為可點擊

#### Scenario: 未持有對應書籍講師身分不可開該書的課
- **WHEN** 使用者持有 `teacher_1` 但未持有 `teacher_2`，點擊「啟動豐盛」卡片
- **THEN** 卡片不響應點擊，維持灰暗不可選取狀態，顯示「須具備啟動豐盛講師身分才能授課」提示文字

#### Scenario: 無資格的課程卡片不可點擊
- **WHEN** 使用者未持有某課程對應的書籍講師身分，點擊該課程卡片
- **THEN** 卡片不響應點擊，維持灰暗不可選取狀態，顯示「須具備{書名}講師身分才能授課」提示文字

#### Scenario: 未選課程不可進入下一步
- **WHEN** 使用者未點擊任何課程卡片
- **THEN** 「下一步」按鈕保持 disabled

#### Scenario: admin 可點擊所有課程卡片
- **WHEN** role 為 `admin` 或 `superadmin` 的使用者進入 Step 1
- **THEN** 所有開放課程卡片均可點擊，無資格限制

### Requirement: 開課設定公開媒合
開課流程（基本資料步驟）SHALL 提供「公開媒合」開關，預設為**關閉**（不公開）。開啟時 SHALL 可填寫「公開招募備註」（選填，最長 500 字）。送出後 `createCourseSession` SHALL 將 `isPublicMatch` 與 `matchNote` 寫入 `CourseInvite`；關閉時 `matchNote` 可留空。

#### Scenario: 預設不公開
- **WHEN** 講師未開啟「公開媒合」即送出開課
- **THEN** 建立的課程 `isPublicMatch = false`，不出現在布告欄

#### Scenario: 開啟公開媒合並填備註
- **WHEN** 講師開啟「公開媒合」、填寫招募備註並送出
- **THEN** 建立的課程 `isPublicMatch = true` 且 `matchNote` 為所填內容

#### Scenario: 招募備註長度上限
- **WHEN** 招募備註超過 500 字
- **THEN** 送出被擋下並顯示長度上限提示
