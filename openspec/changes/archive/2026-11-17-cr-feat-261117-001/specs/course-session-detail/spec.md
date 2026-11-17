## MODIFIED Requirements

### Requirement: 基本資訊區塊

課程詳情頁 SHALL 顯示「**課程基本資訊**」區塊，欄位依序為：授課老師（realName 或 name + email）、報名人數、預計開課日期（CourseOrder.courseDate）、報名截止日期（expiredAt）、開始上課日期、課程結業日期。

課程已開始（`startedAt != null`）時 SHALL 顯示**開始上課日期**；課程已結業（`completedAt != null`）時 SHALL 再顯示**課程結業日期**。兩者對所有可檢視課程頁的使用者可見。

授課老師姓名 SHALL 為可點擊連結，導向該講師的個人首頁 `/user/<spiritId 小寫>`（比照 `components/admin/member-home-link.tsx` 的連結模式），於**新分頁**開啟（`target="_blank"`、`rel="noopener noreferrer"`）。講師 `spiritId` 為 `null` 時，授課老師姓名 SHALL NOT 產生連結，維持純文字顯示。此連結 SHALL 對**任何能開啟本課程詳情頁的登入使用者**皆可點擊，不限管理者或該課講師。

#### Scenario: 顯示完整基本資訊

- **WHEN** 使用者開啟課程詳情頁
- **THEN** 「課程基本資訊」區塊依序顯示授課老師、報名人數、預計開課日期、報名截止日期（及已開始/已結業時的兩個日期欄位）

#### Scenario: 開課日期或截止日期為空

- **WHEN** CourseOrder.courseDate 或 expiredAt 為 null
- **THEN** 對應欄位顯示「—」或不顯示該列

#### Scenario: 進行中顯示開始上課日期

- **WHEN** 課程 `startedAt != null` 且尚未結業
- **THEN** 「課程基本資訊」區塊顯示開始上課日期，不顯示課程結業日期

#### Scenario: 點擊授課老師姓名導向其個人首頁

- **WHEN** 已登入使用者開啟課程詳情頁，且該課講師 `spiritId` 非空
- **THEN** 授課老師姓名為可點擊連結，點擊於新分頁開啟該講師的 `/user/<spiritId 小寫>` 個人首頁

#### Scenario: 講師 spiritId 為空時不產生連結

- **WHEN** 該課講師 `spiritId` 為 `null`
- **THEN** 授課老師姓名維持純文字顯示，不可點擊
