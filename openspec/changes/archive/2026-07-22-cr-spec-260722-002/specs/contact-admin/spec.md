## ADDED Requirements

### Requirement: 提問資料模型
系統 SHALL 提供 `SupportInquiry` 資料模型記錄學員提問，包含：分類（`SupportInquiryCategory`：帳號問題／課程問題／購買教材問題／其他）、內容（自由文字）、提問學員、狀態（`SupportInquiryStatus`：待處理／已回覆，預設待處理）、回覆內容、回覆管理者、回覆時間、建立時間。

#### Scenario: 建立提問時預設待處理
- **WHEN** 學員送出一筆提問
- **THEN** 系統建立 `SupportInquiry` 記錄，`status = pending`，回覆相關欄位皆為空

### Requirement: Topbar 聯繫管理者入口
Topbar 右上角 SHALL 提供「我需要幫助」圖示按鈕，點擊後開啟提問 Dialog。

#### Scenario: 點擊我需要幫助按鈕
- **WHEN** 已登入學員點擊 Topbar「我需要幫助」按鈕
- **THEN** 彈出提問 Dialog，標題為「聯繫管理者」

### Requirement: 提問 Dialog 送出提問
提問 Dialog SHALL 提供問題分類選擇（帳號問題、課程問題、購買教材問題、其他，四選一必填）與內容輸入框（必填），送出後建立提問記錄並關閉 Dialog。

#### Scenario: 送出提問成功
- **WHEN** 學員選擇分類並填寫內容後點擊送出
- **THEN** 系統建立 `SupportInquiry` 記錄，顯示「提問已送出」提示，Dialog 關閉

#### Scenario: 未選分類或未填內容
- **WHEN** 學員未選擇分類或內容為空即點擊送出
- **THEN** 顯示對應必填提示，不送出

### Requirement: 個人專區顯示我的提問
學員個人專區 SHALL 提供「我的提問」清單頁面，顯示自己送出過的所有提問：分類、內容、狀態（待處理／已回覆）、回覆內容（若已回覆）、回覆管理者顯示名稱、回覆時間、提問時間，依提問時間倒序排列。

#### Scenario: 檢視待處理提問
- **WHEN** 學員開啟「我的提問」頁面，某筆提問狀態為待處理
- **THEN** 該筆顯示「待處理」狀態標示，不顯示回覆內容

#### Scenario: 檢視已回覆提問
- **WHEN** 某筆提問已由管理者回覆
- **THEN** 該筆顯示「已回覆」狀態、回覆內容、回覆管理者顯示名稱與回覆時間

#### Scenario: 尚無提問時的空狀態
- **WHEN** 學員尚未送出過任何提問
- **THEN** 顯示空狀態提示，無提問清單
