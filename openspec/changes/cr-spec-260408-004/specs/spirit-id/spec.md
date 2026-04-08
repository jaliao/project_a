## ADDED Requirements

### Requirement: UI 統一使用「啟動編號」顯示 spiritId
系統所有使用者介面 SHALL 以「啟動編號」作為 `spiritId` 欄位的顯示名稱，不再使用「靈人編號」或「Spirit ID」。

#### Scenario: Onboarding Step 3 顯示啟動編號
- **WHEN** 使用者完成 Onboarding 進入 Step 3 歡迎畫面
- **THEN** 編號區塊標籤顯示「您的啟動編號」

#### Scenario: 個人資料頁顯示啟動編號
- **WHEN** 使用者開啟個人資料頁（`/user/[spiritId]`）
- **THEN** 編號欄位標籤顯示「啟動編號」，不顯示「Spirit ID」

#### Scenario: 課程邀請輸入框提示啟動編號
- **WHEN** 講師使用邀請功能輸入學員編號
- **THEN** 輸入框 placeholder 顯示「輸入啟動編號（例：PA260001）」
