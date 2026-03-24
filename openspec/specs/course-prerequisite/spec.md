## ADDED Requirements

### Requirement: 學習進度等級計算
系統 SHALL 根據使用者的 InviteEnrollment 記錄推算其學習進度等級（learningLevel）。learningLevel 為該使用者所有 InviteEnrollment 中 courseLevel 的最大數字值（level1=1、level2=2，依此類推）。無任何 InviteEnrollment 時 learningLevel 為 0。

#### Scenario: 已完成 level1 的使用者
- **WHEN** 系統計算使用者的 learningLevel，該使用者有 level1 的 InviteEnrollment
- **THEN** learningLevel 為 1

#### Scenario: 已完成 level1 與 level2 的使用者
- **WHEN** 系統計算使用者的 learningLevel，該使用者同時有 level1 和 level2 的 InviteEnrollment
- **THEN** learningLevel 為 2

#### Scenario: 無任何學習紀錄的使用者
- **WHEN** 系統計算使用者的 learningLevel，該使用者無任何 InviteEnrollment
- **THEN** learningLevel 為 0

### Requirement: 建立邀請需通過先修驗證（教師）
`createInvite`（及 `createCourseSession`）SHALL 驗證教師的 learningLevel 大於或等於所選課程的 level 數字。`admin` 與 `superadmin` 角色豁免此驗證，可直接建立任何課程邀請。不符合時拒絕建立並回傳錯誤訊息。

#### Scenario: 教師嘗試建立 level1 邀請但 learningLevel 為 0
- **WHEN** role 為 `user`、learningLevel 為 0 的使用者嘗試建立 啟動靈人 1 邀請
- **THEN** 系統拒絕，回傳「需先完成啟動靈人 1 才能開設此課程」

#### Scenario: 教師已完成 level1 可建立 level1 邀請
- **WHEN** role 為 `user`、learningLevel 為 1 的使用者嘗試建立 啟動靈人 1 邀請
- **THEN** 系統允許，邀請建立成功

#### Scenario: 教師嘗試建立 level2 邀請但只完成 level1
- **WHEN** role 為 `user`、learningLevel 為 1 的使用者嘗試建立 啟動靈人 2 邀請
- **THEN** 系統拒絕，回傳「需先完成啟動靈人 2 才能開設此課程」

#### Scenario: 教師已完成 level2 可建立 level2 邀請
- **WHEN** role 為 `user`、learningLevel 為 2 的使用者嘗試建立 啟動靈人 2 邀請
- **THEN** 系統允許，邀請建立成功

#### Scenario: 管理者不需先修即可建立任何課程邀請
- **WHEN** role 為 `admin` 或 `superadmin` 的使用者嘗試建立任意 level 邀請
- **THEN** 系統允許，略過先修驗證，邀請建立成功

### Requirement: 加入邀請需通過先修驗證（學員）
`joinInvite` SHALL 驗證學員的 learningLevel 大於或等於邀請課程的 prerequisiteLevel。不符合時拒絕加入並回傳錯誤訊息。

#### Scenario: 學員嘗試加入 level2 邀請但未完成 level1
- **WHEN** learningLevel 為 0 的使用者嘗試加入 啟動靈人 2 邀請
- **THEN** 系統拒絕，回傳「需先完成啟動靈人 1 才能加入此課程」

#### Scenario: 學員已完成 level1 可加入 level2 邀請
- **WHEN** learningLevel 為 1 的使用者嘗試加入 啟動靈人 2 邀請
- **THEN** 系統允許，加入成功

#### Scenario: 學員加入 level1 邀請不需先修
- **WHEN** learningLevel 為 0 的使用者嘗試加入 啟動靈人 1 邀請
- **THEN** 系統允許，加入成功（level1 無先修條件）
