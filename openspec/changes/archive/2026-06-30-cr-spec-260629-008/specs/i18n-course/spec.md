## ADDED Requirements

### Requirement: 課程頁在地化
課程頁（`course/[id]` 詳情、`course/[id]/graduate` 結業、`course-sessions` 查詢）的 UI 文案 SHALL 以 `course` 命名空間取用、隨當前語言呈現，不寫死語言字串；server 文案用 `getTranslations`、client 互動用 `useTranslations`，動態數值以 ICU 參數代入。

#### Scenario: 課程詳情頁在地化
- **WHEN** 以非預設語言開啟課程詳情頁
- **THEN** 區塊標題、欄位標籤、按鈕、狀態說明、空狀態以該語言呈現；課程名/講師名等內容原樣顯示

#### Scenario: 結業表單頁在地化
- **WHEN** 以非預設語言開啟結業表單頁
- **THEN** 表單標題、步驟與按鈕以該語言呈現

### Requirement: 課程元件在地化
`components/course-session`、`components/course-faq`、`components/course-catalog` 的靜態 UI 文案 SHALL 以 i18n 取用。

#### Scenario: 課程卡與詳情元件在地化
- **WHEN** 以非預設語言檢視含課程卡或課程詳情子元件的頁面
- **THEN** 其靜態文字以該語言呈現

#### Scenario: 共用 schema 驗證不在本批
- **WHEN** 檢視使用與後台共用之 `course-*` schema 的表單（如開課精靈）
- **THEN** 其驗證訊息維持原狀（不 key 化），後台不受影響

### Requirement: 課程網域範圍邊界
本批 SHALL NOT 涵蓋 `components/course-order`（教材訂購）與 `components/course-invite`（邀請操作）；亦 SHALL NOT 在地化使用者產生內容與相對時間。未遷移處 SHALL 回退繁體。

#### Scenario: 範圍外維持原狀
- **WHEN** 檢視教材訂購/邀請操作元件或內容資料
- **THEN** 維持繁體（內容）或留待後續批次，缺 key 回退繁體、不破版
