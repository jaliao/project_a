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
