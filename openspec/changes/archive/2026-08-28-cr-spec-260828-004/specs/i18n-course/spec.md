## MODIFIED Requirements

### Requirement: 課程元件在地化
`components/course-session`、`components/course-catalog` 的靜態 UI 文案 SHALL 以 i18n 取用。

（原一併列入的 `components/course-faq` 已隨課程 FAQ 功能下架而移除，不再適用——見 CR-SPEC-260828-004。）

#### Scenario: 課程卡與詳情元件在地化
- **WHEN** 以非預設語言檢視含課程卡或課程詳情子元件的頁面
- **THEN** 其靜態文字以該語言呈現

#### Scenario: 共用 schema 驗證不在本批
- **WHEN** 檢視使用與後台共用之 `course-*` schema 的表單（如開課精靈）
- **THEN** 其驗證訊息維持原狀（不 key 化），後台不受影響

#### Scenario: 教材申請對話框在地化
- **WHEN** 以非預設語言開啟老師/管理者的教材申請對話框（`material-order-dialog`）
- **THEN** Dialog 標題、取貨方式標籤、欄位標籤、按鈕文字以該語言呈現
