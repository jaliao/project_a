# contact-admin Specification

## Purpose
TBD - created by archiving change cr-spec-260722-002. Update Purpose after archive.

## Requirements

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

### Requirement: 個人頁學習紀錄區塊嵌入最近提問
學員個人頁 SHALL 提供「聯繫管理者」區塊（標題與圖示比照 Topbar「聯絡管理者」按鈕，使用相同的訊息圖示），區塊標題（含圖示）SHALL 可點擊，導向 `/user/{spiritId}/inquiries`。區塊內容 SHALL 以卡片式排版呈現：最近 2 筆「聯繫管理者」提問（`SupportInquiry`，依提問時間倒序）各為一張卡片（分類、內容、狀態徽章、回覆內容等，比照 `/user/{spiritId}/inquiries` 頁面清單卡片樣式），加上固定顯示於最後一格的「填寫新提問」表單卡片，供學員直接於個人頁送出新提問。提問筆數不足 2 筆時，僅顯示現有筆數的提問卡片＋表單卡片，不補空白佔位卡。此區塊 SHALL 僅於本人瀏覽自己的個人頁時顯示。

#### Scenario: 顯示最近 2 筆提問卡片與表單卡片
- **WHEN** 學員瀏覽自己的個人頁「聯繫管理者」區塊，且已送出 2 筆以上提問
- **THEN** 區塊顯示依提問時間倒序排列的最近 2 筆提問卡片，加上最後一格的填寫新提問表單卡片，共 3 張卡片

#### Scenario: 提問筆數不足 2 筆
- **WHEN** 學員送出的提問少於 2 筆（0 或 1 筆）
- **THEN** 區塊僅顯示現有提問卡片（0 或 1 張）加上表單卡片，不補空白佔位卡

#### Scenario: 於個人頁直接送出新提問
- **WHEN** 學員於個人頁「聯繫管理者」區塊的表單卡片選擇分類、填寫內容並送出
- **THEN** 系統建立 `SupportInquiry` 記錄，顯示「提問已送出」提示，區塊即時更新顯示新提問卡片

#### Scenario: 點擊區塊標題導向完整提問歷史
- **WHEN** 學員點擊「聯繫管理者」區塊標題（或圖示）
- **THEN** 系統導向 `/user/{spiritId}/inquiries` 頁面，可檢視完整提問清單

#### Scenario: 不公開給其他會員
- **WHEN** 其他會員瀏覽該學員的公開個人頁
- **THEN** 不顯示「聯繫管理者」區塊

### Requirement: 我的提問頁面標題更名為聯繫管理者
`/user/{spiritId}/inquiries` 頁面標題（含瀏覽器標籤與頁面可見標題）SHALL 顯示為「聯繫管理者」，取代原本的「我的提問」；頁面內容（送出提問表單、提問清單）維持不變。

#### Scenario: 頁面標題顯示聯繫管理者
- **WHEN** 學員開啟 `/user/{spiritId}/inquiries` 頁面
- **THEN** 瀏覽器標籤與頁面可見標題皆顯示「聯繫管理者」
