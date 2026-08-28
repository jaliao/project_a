# course-session-detail Delta（cr-spec-260828-002）

## MODIFIED Requirements

### Requirement: 講師專屬：複製邀請連結

**該課講師（`CourseInvite.createdById == 當前使用者`）或管理者（`canAccessAdmin`）** SHALL 在**課程基本資訊卡片下方**看到「複製邀請連結」按鈕，點擊後複製 `/invite/{token}` 連結至剪貼簿。
「聯繫管理者」按鈕 SHALL 維持僅該課講師可見（語意為講師向管理者求助的管道）。

#### Scenario: 講師複製連結

- **WHEN** 該課講師點擊「複製邀請連結」按鈕
- **THEN** 連結複製至剪貼簿，按鈕短暫顯示「已複製！」

#### Scenario: 管理者複製連結

- **WHEN** 管理者（非該課講師）開啟課程詳情頁並點擊「複製邀請連結」
- **THEN** 連結複製至剪貼簿，按鈕短暫顯示「已複製！」

#### Scenario: 複製按鈕位置

- **WHEN** 該課講師或管理者開啟課程詳情頁
- **THEN** 複製邀請連結按鈕顯示於課程基本資訊卡片內的底部一列，與「編輯」按鈕同排

#### Scenario: 聯繫管理者按鈕維持講師專屬

- **WHEN** 管理者（非該課講師）開啟課程詳情頁
- **THEN** 不顯示「聯繫管理者」按鈕

### Requirement: 講師專屬：取消授課

系統 SHALL 僅在課程未取消且未結業時顯示「取消授課」按鈕，對**該課講師與管理者**顯示。
「開始上課」區塊 SHALL 對**該課講師或管理者（`canAccessAdmin`）**顯示（開課門檻條件不變）；`startCourseSession` Server Action SHALL 權威驗證呼叫者為該課 `createdById` 或具 `canAccessAdmin`。
「教材申請」區塊 SHALL 對**該課講師或管理者**顯示（追認現況）。

#### Scenario: 取消授課按鈕可見條件

- **WHEN** 使用者為該課講師或管理者，且課程未取消、未結業
- **THEN** 顯示「取消授課」按鈕

#### Scenario: 管理者可見開始上課與教材申請區塊

- **WHEN** 管理者（非該課講師）查看招生中課程的詳情頁
- **THEN** 顯示「開始上課」與「教材申請」區塊；「開始上課」按鈕仍受開課門檻（≥1 已核准學員、教材需求已處理、教材已收件）約束

#### Scenario: 管理者開始上課

- **WHEN** 管理者於符合開課門檻的招生中課程點擊「開始上課」並確認日期
- **THEN** 課程 `startedAt` 更新、狀態轉為進行中；未達門檻時 Server Action 回傳門檻未滿足訊息

#### Scenario: 無權限者呼叫開始上課被拒

- **WHEN** 非該課講師且非管理者的使用者呼叫 `startCourseSession`
- **THEN** 回傳 `{ success: false, message: '無權限執行此操作' }`，課程狀態不變

### Requirement: 講師專屬：公開媒合設定

課程詳情頁 SHALL 讓**課程講師（`createdById === 目前使用者`）或管理者（`canAccessAdmin`）**切換「公開媒合」開關並編輯／清除「公開招募備註」，透過 Server Action `updateMatchSettings(inviteId, { isPublicMatch, matchNote })`。公開媒合設定編輯器 SHALL 於課程詳情頁對管理者顯示（不再僅限該課講師）。關閉公開媒合時 SHALL 保留既有 `matchNote`（不清空），僅不再於布告欄顯示。

#### Scenario: 講師開啟公開媒合

- **WHEN** 課程講師於詳情頁開啟「公開媒合」並儲存
- **THEN** `isPublicMatch = true`，課程出現在媒合布告欄

#### Scenario: 管理者編輯公開媒合設定

- **WHEN** 管理者（非該課講師）於詳情頁看到公開媒合設定編輯器，修改招募備註並儲存
- **THEN** `matchNote` 更新為新內容，布告欄卡片顯示新備註

#### Scenario: 關閉公開媒合保留備註

- **WHEN** 課程講師或管理者關閉「公開媒合」
- **THEN** `isPublicMatch = false`、課程自布告欄移除，但 `matchNote` 內容保留

#### Scenario: 非講師非管理者不可修改

- **WHEN** 非該課程講師且不具 `canAccessAdmin` 的使用者呼叫 `updateMatchSettings`
- **THEN** 回傳 `{ success: false, message: '無權限' }`，不變更資料
