## MODIFIED Requirements

### Requirement: 提問資料模型
系統 SHALL 提供 `SupportInquiry` 資料模型記錄學員提問，包含：分類（`SupportInquiryCategory`：帳號問題／課程問題／購買教材問題／其他）、內容（自由文字）、提問學員、狀態（`SupportInquiryStatus`：待處理／已回覆，預設待處理）、回覆內容、回覆管理者、回覆時間、建立時間、可選的關聯課程（`courseInviteId`，記錄此提問是否來自特定課程頁）。

#### Scenario: 建立提問時預設待處理
- **WHEN** 學員送出一筆提問
- **THEN** 系統建立 `SupportInquiry` 記錄，`status = pending`，回覆相關欄位皆為空

#### Scenario: 一般提問無課程關聯
- **WHEN** 學員透過個人專區一般提問表單送出提問
- **THEN** 建立的 `SupportInquiry` 記錄 `courseInviteId` 為 `null`

#### Scenario: 課程頁提問記錄課程關聯
- **WHEN** 學員透過課程頁「聯繫管理者」入口送出提問
- **THEN** 建立的 `SupportInquiry` 記錄 `courseInviteId` 為該課程之 `CourseInvite.id`

### Requirement: Topbar 聯繫管理者入口
Topbar SHALL 提供「聯絡管理者」圖示按鈕，點擊後導向個人專區「我的提問」頁面（`/user/{spiritId}/inquiries`），不彈出對話框。

#### Scenario: 點擊聯絡管理者按鈕
- **WHEN** 已登入學員點擊 Topbar「聯絡管理者」按鈕
- **THEN** 系統導向 `/user/{spiritId}/inquiries` 頁面

### Requirement: 個人專區送出提問與檢視我的提問
學員個人專區「我的提問」頁面 SHALL 同時提供：①送出新提問的表單（問題分類四選一必填：帳號問題、課程問題、購買教材問題、其他；內容必填）；②自己送出過的所有提問清單，顯示分類、內容、狀態（待處理／已回覆）、回覆內容（若已回覆）、回覆管理者顯示名稱、回覆時間、提問時間，依提問時間倒序排列。

#### Scenario: 頁面內送出提問成功
- **WHEN** 學員於「我的提問」頁面選擇分類並填寫內容後點擊送出
- **THEN** 系統建立 `SupportInquiry` 記錄，顯示「提問已送出」提示，清單即時更新顯示新提問

#### Scenario: 未選分類或未填內容
- **WHEN** 學員未選擇分類或內容為空即點擊送出
- **THEN** 顯示對應必填提示，不送出

#### Scenario: 檢視待處理提問
- **WHEN** 學員檢視「我的提問」頁面，某筆提問狀態為待處理
- **THEN** 該筆顯示「待處理」狀態標示，不顯示回覆內容

#### Scenario: 檢視已回覆提問
- **WHEN** 某筆提問已由管理者回覆
- **THEN** 該筆顯示「已回覆」狀態、回覆內容、回覆管理者顯示名稱與回覆時間

#### Scenario: 尚無提問時的空狀態
- **WHEN** 學員尚未送出過任何提問
- **THEN** 清單顯示空狀態提示，送出表單仍可正常使用

## ADDED Requirements

### Requirement: 課程頁聯繫管理者入口
課程詳情頁 SHALL 於 Share（複製邀請連結）按鈕右邊提供「聯繫管理者」按鈕，顯示條件與 Share 按鈕相同（該課程講師可見）；點擊開啟提問 Dialog，問題分類固定為「課程問題」（不需選擇），送出後記錄與該課程的關聯（`courseInviteId`）。

#### Scenario: 顯示課程頁聯繫管理者按鈕
- **WHEN** 該課程講師開啟課程詳情頁
- **THEN** Share 按鈕右邊顯示「聯繫管理者」按鈕

#### Scenario: 課程頁提問固定分類
- **WHEN** 講師點擊課程頁「聯繫管理者」按鈕開啟 Dialog
- **THEN** Dialog 顯示分類已固定為「課程問題」，無需選擇，僅需填寫內容

#### Scenario: 課程頁提問送出成功
- **WHEN** 講師於課程頁提問 Dialog 填寫內容後送出
- **THEN** 系統建立 `SupportInquiry` 記錄（`category = course`、`courseInviteId` 為當前課程），顯示成功提示並關閉 Dialog
