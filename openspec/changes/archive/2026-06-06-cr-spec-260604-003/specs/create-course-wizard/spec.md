## ADDED Requirements

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
