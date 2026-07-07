# course-session-detail Delta Specification

## MODIFIED Requirements

### Requirement: 基本資訊區塊
課程詳情頁 SHALL 顯示基本資訊區塊，包含：開課內容（title）、課程等級、開課日期（CourseOrder.courseDate）、報名截止日期（expiredAt）、授課老師（realName 或 name + email）。
課程已開始（`startedAt != null`）時 SHALL 另顯示**開始上課日期**；課程已結業（`completedAt != null`）時 SHALL 再顯示**結業日期**。兩者對所有可檢視課程頁的使用者可見。

#### Scenario: 顯示完整基本資訊
- **WHEN** 使用者開啟課程詳情頁
- **THEN** 頁面顯示課程名稱、等級標籤、開課日期、報名截止日期、授課老師姓名與 Email

#### Scenario: 開課日期或截止日期為空
- **WHEN** CourseOrder.courseDate 或 expiredAt 為 null
- **THEN** 對應欄位顯示「—」或不顯示該列

#### Scenario: 進行中顯示開始上課日期
- **WHEN** 課程 `startedAt != null` 且尚未結業
- **THEN** 基本資訊區顯示開始上課日期（`startedAt` 格式化為日期），不顯示結業日期

#### Scenario: 已結業顯示兩個日期
- **WHEN** 課程 `completedAt != null`
- **THEN** 基本資訊區同時顯示開始上課日期與結業日期

#### Scenario: 招生中不顯示
- **WHEN** 課程 `startedAt = null`
- **THEN** 基本資訊區不顯示開始上課日期與結業日期列
