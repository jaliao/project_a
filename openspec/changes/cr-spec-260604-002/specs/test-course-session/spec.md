## ADDED Requirements

### Requirement: 測試授課按鈕僅於測試環境顯示
系統 SHALL 在使用者個人頁（`/user/[spiritId]`）既有「新增授課」按鈕旁，提供「新增測試授課」按鈕。此按鈕 SHALL 僅於 `process.env.NODE_ENV === 'development'` 時渲染；於 production 環境 SHALL NOT 渲染任何相關 UI。

#### Scenario: 開發環境顯示按鈕
- **WHEN** `NODE_ENV` 為 `development`，講師開啟自己的個人頁
- **THEN** 「新增授課」按鈕旁顯示「新增測試授課」按鈕

#### Scenario: production 不顯示按鈕
- **WHEN** `NODE_ENV` 為 `production`
- **THEN** 個人頁不渲染「新增測試授課」按鈕或任何相關 UI

### Requirement: 一鍵建立測試授課
點擊「新增測試授課」SHALL 一次建立一筆完整的測試授課資料：1 筆 `CourseInvite`（`courseCatalogId = 1` 啟動靈人、`maxCount = 5`、建立者為當前使用者、`startedAt` 為 null 代表待開課），並設定預計開課日期（`courseDate`）與報名截止日期（`expiredAt`），且 `expiredAt` SHALL 早於 `courseDate`。SHALL 關聯 5 位學員的 `InviteEnrollment`。SHALL NOT 建立任何 `CourseOrder`（代表教材尚未送出）。

#### Scenario: 成功建立測試授課
- **WHEN** 講師於開發環境點擊「新增測試授課」
- **THEN** 系統建立 1 筆 `CourseInvite`（啟動靈人、`maxCount=5`、`createdById` 為當前使用者、未設 `startedAt`）並回傳成功訊息

#### Scenario: 設定計畫日期
- **WHEN** 測試授課建立完成
- **THEN** `CourseInvite.courseDate`（預計開課日期）與 `expiredAt`（報名截止日期）皆有值，且 `expiredAt` 早於 `courseDate`

#### Scenario: 不建立教材訂購單
- **WHEN** 測試授課建立完成
- **THEN** 該 `CourseInvite` 的 `courseOrderId` 為 null，系統未建立任何 `CourseOrder`

#### Scenario: 待開課狀態
- **WHEN** 測試授課建立完成
- **THEN** `CourseInvite.startedAt`、`cancelledAt`、`completedAt` 皆為 null（處於已報名、待開課狀態）

### Requirement: 動態建立五位臨時測試學員
系統 SHALL 在每次建立測試授課時，動態建立 5 位臨時測試 `User`，每位 SHALL 具備唯一 `email`、`realName` 與自動核發的唯一 `spiritId`，並各建立 1 筆 `InviteEnrollment`（`status = approved`）關聯至該授課。每位學員的 `materialChoice` SHALL 自 `none`（無）、`traditional`（繁體）、`simplified`（簡體）中隨機指派。

#### Scenario: 建立五位學員並報名
- **WHEN** 測試授課建立完成
- **THEN** 系統建立 5 位新的臨時測試 `User`，並為每位建立 `status = approved` 的 `InviteEnrollment`，共 5 筆

#### Scenario: 隨機指派教材選項
- **WHEN** 系統為 5 位測試學員建立報名
- **THEN** 每筆 `InviteEnrollment.materialChoice` 為 `none`、`traditional`、`simplified` 三者之一（隨機）

#### Scenario: 臨時學員具唯一識別
- **WHEN** 系統建立臨時測試學員
- **THEN** 每位學員的 `email` 與 `spiritId` 皆唯一，不與既有資料衝突

#### Scenario: 重複點擊各自獨立
- **WHEN** 講師連續點擊「新增測試授課」兩次
- **THEN** 系統各自建立獨立的授課與各 5 位新學員，彼此不共用學員、不互相衝突

### Requirement: Server Action 環境守衛
建立測試授課的 Server Action SHALL 驗證使用者已登入，且 SHALL 於 `NODE_ENV === 'production'` 時直接拒絕執行（深度防禦，不僅依賴 UI 隱藏）。

#### Scenario: production 呼叫被拒絕
- **WHEN** 於 `NODE_ENV === 'production'` 直接呼叫此 Server Action
- **THEN** 系統拒絕並回傳失敗（不建立任何資料）

#### Scenario: 未登入呼叫被拒絕
- **WHEN** 未登入者呼叫此 Server Action
- **THEN** 系統回傳「請先登入」並不建立任何資料
