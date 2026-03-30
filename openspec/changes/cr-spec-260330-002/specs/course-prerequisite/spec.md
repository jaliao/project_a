## MODIFIED Requirements

### Requirement: 先修驗證邏輯（教師開課）
`createInvite`（及 `createCourseSession`）SHALL 驗證教師已結業（`InviteEnrollment.graduatedAt IS NOT NULL`，透過 `CourseInvite.courseCatalogId` join）於目標課程的所有先修課程。`admin` 與 `superadmin` 角色豁免此驗證。不符合時拒絕並回傳錯誤訊息，說明缺少哪門先修課程（顯示 `CourseCatalog.label`）。

#### Scenario: 教師缺少先修結業記錄
- **WHEN** role 為 `user` 的教師嘗試建立某課程邀請，且尚未結業於該課程的任一先修課程
- **THEN** 系統拒絕，回傳「需先完成 {先修課程名稱} 才能開設此課程」

#### Scenario: 教師已完成所有先修可建立邀請
- **WHEN** role 為 `user` 的教師已結業於目標課程的所有先修課程
- **THEN** 系統允許，邀請建立成功

#### Scenario: 目標課程無先修條件
- **WHEN** 目標課程的 `prerequisites` 為空集合
- **THEN** 任何 role 為 `user` 的教師均可建立該課程邀請（無先修限制）

#### Scenario: 管理者不需先修即可建立任何課程邀請
- **WHEN** role 為 `admin` 或 `superadmin` 的使用者嘗試建立任意課程邀請
- **THEN** 系統允許，略過先修驗證，邀請建立成功

### Requirement: 先修驗證邏輯（學員報名）
`joinInvite` SHALL 驗證學員已結業（`InviteEnrollment.graduatedAt IS NOT NULL`）於邀請課程的所有先修課程。不符合時拒絕並回傳錯誤訊息（顯示 `CourseCatalog.label`）。

#### Scenario: 學員缺少先修結業記錄
- **WHEN** 學員嘗試加入某課程邀請，且尚未結業於該課程的任一先修課程
- **THEN** 系統拒絕，回傳「需先完成 {先修課程名稱} 才能加入此課程」

#### Scenario: 學員已完成所有先修可加入邀請
- **WHEN** 學員已結業於目標課程的所有先修課程
- **THEN** 系統允許，加入成功

#### Scenario: 學員加入無先修課程不需條件
- **WHEN** 課程的 `prerequisites` 為空，學員嘗試加入
- **THEN** 系統允許，加入成功

## REMOVED Requirements

### Requirement: 學習進度等級計算
**Reason**: `getUserLearningLevel()` 依賴 `CourseLevel` enum 數字排序；enum 移除後此函式一併刪除。先修驗證改為比對結業課程 id 集合，不再需要單一數字等級。
**Migration**: 先修驗證改呼叫 `checkPrerequisites(userId, targetCatalogId)`；learner profile 的「已完成課程」顯示改為查 `CourseCatalog.label`（結業記錄集合）。
