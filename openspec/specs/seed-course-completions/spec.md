## ADDED Requirements

### Requirement: Seed 建立示範課程邀請
`prisma/seed.ts` SHALL 建立兩筆由管理員建立的 CourseInvite（啟動靈人 + 啟動豐盛），使開發環境具備完整示範資料。

#### Scenario: 首次執行 seed 時建立課程邀請
- **WHEN** 資料庫中管理員尚無 CourseInvite 時執行 seed
- **THEN** 建立「系統管理員 的 啟動靈人」（catalogId=1）與「系統管理員 的 啟動豐盛」（catalogId=2），兩者 `startedAt` 與 `completedAt` 均設為 `2026-04-02T00:00:00.000Z`

#### Scenario: 重複執行 seed 時不重複建立
- **WHEN** 資料庫中管理員已有 CourseInvite 時執行 seed
- **THEN** 跳過 CourseInvite 與 InviteEnrollment 的建立，不產生重複資料

### Requirement: Seed 建立黃國倫結業紀錄
`prisma/seed.ts` SHALL 為黃國倫（PA260001）在兩個示範課程建立 InviteEnrollment，status=approved、graduatedAt 已設定，使其具備授課資格。

#### Scenario: 黃國倫在兩個課程均有結業紀錄
- **WHEN** seed 建立示範課程邀請後
- **THEN** 黃國倫在「啟動靈人」與「啟動豐盛」各有一筆 InviteEnrollment，status=approved，graduatedAt=2026-04-02

#### Scenario: 黃國倫可以開始授課
- **WHEN** seed 執行完成後
- **THEN** 黃國倫的 `getMyCompletionCertificates` 回傳兩筆結業證書，canTeach=true
